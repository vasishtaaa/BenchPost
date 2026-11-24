from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, UserProfile, UserRole
from app.schemas.user import UserRegister, UserLogin, UserResponse, Token, PasswordChange
from app.api.deps import get_current_active_user

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new student, faculty, or administrator."""
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Check student ID uniqueness if provided
    if user_in.student_id:
        existing_profile = db.query(UserProfile).filter(UserProfile.student_id == user_in.student_id).first()
        if existing_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A student with this Student ID is already registered."
            )

    # Create User record
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True,
        is_verified=False
    )
    db.add(db_user)
    db.flush()  # Flush to generate db_user.id for profile foreign key

    # Create UserProfile record
    db_profile = UserProfile(
        user_id=db_user.id,
        full_name=user_in.full_name,
        student_id=user_in.student_id,
        department=user_in.department,
        course=user_in.course,
        academic_year=user_in.academic_year,
        avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={user_in.full_name}"
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_user)

    # Issue access token immediately for seamless onboarding
    token = create_access_token(subject=db_user.id, role=db_user.role.value)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": db_user
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT access token."""
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact campus administration."
        )

    token = create_access_token(subject=user.id, role=user.role.value)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Retrieve full profile details for the currently authenticated user."""
    return current_user

@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password after verifying the existing password."""
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
