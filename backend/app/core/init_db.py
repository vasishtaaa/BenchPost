from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserProfile, UserRole
from app.models.community import Community, CommunityMember, CommunityRole, MembershipStatus
from app.models.discussion import Post, Comment, Reaction, Bookmark, ReactionType
from app.models.poll import Poll, PollOption, PollVote
from app.models.event import Event, EventRegistration
from app.models.announcement import Announcement, AnnouncementRead
from app.models.notification import Notification
from app.models.moderation import Report, AuditLog

def init_db(db: Session = None) -> None:
    """Initialize database tables and create standard demo accounts, communities, and seed discussions."""
    close_db = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_db = True

    try:
        # 1. Administrator Account
        admin_email = "admin@campusloop.edu"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash("Admin@123456"),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.flush()
            admin_profile = UserProfile(
                user_id=admin_user.id,
                full_name="Dr. Campus Administrator",
                department="Computer Science & Engineering",
                course="Administrative Board",
                avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Admin",
                bio="Benchpost University System Administrator."
            )
            db.add(admin_profile)

        # 2. Faculty Account
        faculty_email = "faculty@campusloop.edu"
        faculty_user = db.query(User).filter(User.email == faculty_email).first()
        if not faculty_user:
            faculty_user = User(
                email=faculty_email,
                hashed_password=get_password_hash("Faculty@123456"),
                role=UserRole.FACULTY,
                is_active=True,
                is_verified=True
            )
            db.add(faculty_user)
            db.flush()
            faculty_profile = UserProfile(
                user_id=faculty_user.id,
                full_name="Prof. Rajesh Sharma",
                department="Computer Science & Engineering",
                course="B.Tech Faculty Coordinator",
                avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Rajesh",
                bio="Associate Professor in CSE. Faculty Advisor for Benchpost Communities."
            )
            db.add(faculty_profile)

        # 3. Student Account
        student_email = "student@campusloop.edu"
        student_user = db.query(User).filter(User.email == student_email).first()
        if not student_user:
            student_user = User(
                email=student_email,
                hashed_password=get_password_hash("Student@123456"),
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True
            )
            db.add(student_user)
            db.flush()
            student_profile = UserProfile(
                user_id=student_user.id,
                full_name="Aarav Vasishta",
                student_id="21CS042",
                department="Computer Science & Engineering",
                course="B.Tech CSE",
                academic_year=3,
                avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Aarav",
                bio="VI Semester B.Tech CSE student passionate about full-stack development and distributed systems."
            )
            db.add(student_profile)

        db.commit()

        # 4. Standard Communities
        communities_seed_data = [
            {
                "name": "CSE Developers",
                "slug": "cse-developers",
                "description": "Central technical community for Computer Science & Engineering students. Discuss algorithms, systems, cloud architecture, and open-source projects.",
                "category": "Engineering",
                "rules": "1. Be respectful to fellow students.\n2. No direct assignment solutions; promote conceptual problem solving.\n3. Format code blocks clearly.",
                "is_private": False,
                "icon_url": "https://api.dicebear.com/7.x/identicon/svg?seed=cse-devs",
                "banner_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80",
                "creator_id": faculty_user.id
            },
            {
                "name": "AI and Machine Learning",
                "slug": "ai-and-machine-learning",
                "description": "Exploring Deep Learning, LLMs, computer vision, research papers, and Kaggle competitions.",
                "category": "Engineering",
                "rules": "1. Cite research paper sources.\n2. Share reproducible code snippets.",
                "is_private": False,
                "icon_url": "https://api.dicebear.com/7.x/identicon/svg?seed=ai-ml",
                "banner_url": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80",
                "creator_id": faculty_user.id
            },
            {
                "name": "Web Development Hub",
                "slug": "web-development-hub",
                "description": "Full-stack web technologies, modern JavaScript/TypeScript frameworks, UI/UX design systems, and frontend engineering.",
                "category": "Engineering",
                "rules": "1. Share live demo links where possible.\n2. Constructive UI/UX critiques only.",
                "is_private": False,
                "icon_url": "https://api.dicebear.com/7.x/identicon/svg?seed=webdev",
                "banner_url": "https://images.unsplash.com/photo-1547658719-da2b51169166?w=1200&auto=format&fit=crop&q=80",
                "creator_id": student_user.id
            },
            {
                "name": "Cybersecurity & Ethical Hacking",
                "slug": "cybersecurity-ethical-hacking",
                "description": "CTF walk-throughs, reverse engineering, network security, web app exploitation, and defensive hardening.",
                "category": "Engineering",
                "rules": "1. Strictly legal, educational, and authorized lab discussions only.\n2. Do not target campus infrastructure.",
                "is_private": False,
                "icon_url": "https://api.dicebear.com/7.x/identicon/svg?seed=cybersec",
                "banner_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
                "creator_id": student_user.id
            },
            {
                "name": "Placement Preparation 2026",
                "slug": "placement-preparation-2026",
                "description": "Curated interview experiences, DSA problem sprints, mock technical rounds, and resume reviews. (Private community, approval required).",
                "category": "Career",
                "rules": "1. Keep company-specific rounds confidential where required.\n2. Support pre-final and final year batchmates.",
                "is_private": True,
                "icon_url": "https://api.dicebear.com/7.x/identicon/svg?seed=placements",
                "banner_url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80",
                "creator_id": faculty_user.id
            },
            {
                "name": "Photography & Media Club",
                "slug": "photography-media-club",
                "description": "Campus visual storytelling, photography workshops, photo walks, and editing tutorials.",
                "category": "Clubs & Arts",
                "rules": "1. Original photos only.\n2. Respect campus privacy guidelines.",
                "is_private": False,
                "icon_url": "https://api.dicebear.com/7.x/identicon/svg?seed=photography",
                "banner_url": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80",
                "creator_id": student_user.id
            },
            {
                "name": "General Student Community",
                "slug": "general-student-community",
                "description": "University-wide student discussions, campus life, recommendations, lost & found, and open student forums.",
                "category": "General",
                "rules": "1. University code of conduct applies at all times.\n2. No commercial spam.",
                "is_private": False,
                "icon_url": "https://api.dicebear.com/7.x/identicon/svg?seed=campus-general",
                "banner_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80",
                "creator_id": admin_user.id
            }
        ]

        for comm_data in communities_seed_data:
            existing_comm = db.query(Community).filter(Community.slug == comm_data["slug"]).first()
            if not existing_comm:
                comm = Community(**comm_data)
                db.add(comm)
                db.flush()

                # Add creator as ADMIN
                creator_member = CommunityMember(
                    community_id=comm.id,
                    user_id=comm.creator_id,
                    role=CommunityRole.ADMIN,
                    status=MembershipStatus.ACTIVE
                )
                db.add(creator_member)

                # For public communities, also enroll our sample student Aarav if not already creator
                if not comm.is_private and comm.creator_id != student_user.id:
                    student_member = CommunityMember(
                        community_id=comm.id,
                        user_id=student_user.id,
                        role=CommunityRole.MEMBER,
                        status=MembershipStatus.ACTIVE
                    )
                    db.add(student_member)

        db.commit()

        # 5. Seed Discussions & Posts
        cse_comm = db.query(Community).filter(Community.slug == "cse-developers").first()
        web_comm = db.query(Community).filter(Community.slug == "web-development-hub").first()
        ai_comm = db.query(Community).filter(Community.slug == "ai-and-machine-learning").first()

        if cse_comm and faculty_user:
            p1_title = "Spring 2025 Midterm Review Format & Focus Areas: Algorithms & Distributed Systems"
            p1 = db.query(Post).filter(Post.title == p1_title).first()
            if not p1:
                p1 = Post(
                    community_id=cse_comm.id,
                    author_id=faculty_user.id,
                    title=p1_title,
                    content="We want to ensure everyone has ample support ahead of next week's examination. Please note our hybrid review session this Friday at 4 PM in Seminar Hall 2 and via Google Meet. Topics covered: Dynamic Programming, Graph Theory, and MapReduce distributed paradigms.",
                    category="Academic Resources",
                    is_pinned=True,
                    views_count=184
                )
                db.add(p1)
                db.flush()

                # Add reaction from student
                r1 = Reaction(user_id=student_user.id, post_id=p1.id, reaction_type=ReactionType.HELPFUL)
                db.add(r1)

                # Add comment from student
                c1 = Comment(
                    post_id=p1.id,
                    author_id=student_user.id,
                    content="Thank you Prof. Sharma! Will the recording be uploaded to the portal for students who have lab clashes?"
                )
                db.add(c1)
                db.flush()

                # Reply from faculty
                r_c1 = Comment(
                    post_id=p1.id,
                    author_id=faculty_user.id,
                    parent_id=c1.id,
                    content="Yes Aarav, the recording and lecture slides will be shared right here on Benchpost immediately after the session."
                )
                db.add(r_c1)

        if web_comm and student_user:
            p2_title = "Open-sourcing Benchpost: Role-Based University Student Community & Collaboration Platform!"
            p2 = db.query(Post).filter(
                Post.community_id == web_comm.id,
                Post.author_id == student_user.id,
                Post.title.in_((p2_title, p2_title.replace("Benchpost", "CampusLoop"))),
            ).first()
            if p2:
                p2.title = p2_title
            if not p2:
                p2 = Post(
                    community_id=web_comm.id,
                    author_id=student_user.id,
                    title=p2_title,
                    content="Excited to announce our full-stack platform built with React, Vite, TypeScript, Tailwind CSS, FastAPI, and SQLAlchemy. Includes atomic capacity verification, RBAC, and threaded discussions. Looking for feedback on our UI/UX design and architecture!",
                    category="Project Showcase",
                    is_pinned=False,
                    views_count=320
                )
                db.add(p2)
                db.flush()

                # Add reaction from faculty and admin
                db.add(Reaction(user_id=faculty_user.id, post_id=p2.id, reaction_type=ReactionType.CELEBRATE))
                db.add(Reaction(user_id=admin_user.id, post_id=p2.id, reaction_type=ReactionType.LIKE))

                # Comment from faculty
                db.add(Comment(
                    post_id=p2.id,
                    author_id=faculty_user.id,
                    content="Outstanding engineering work! The modular architecture and strict database constraints make it a model B.Tech project."
                ))

        if ai_comm and student_user:
            p3_title = "Understanding Loss Convergence in Transformer Multi-Head Self Attention"
            p3 = db.query(Post).filter(Post.title == p3_title).first()
            if not p3:
                p3 = Post(
                    community_id=ai_comm.id,
                    author_id=student_user.id,
                    title=p3_title,
                    content="During pre-training on custom technical datasets, we observed an unexpected loss spike at step 12k. Has anyone resolved this by adjusting warmup schedules or gradient clipping thresholds? Any insight on AdamW vs Adafactor here?",
                    category="Questions",
                    is_pinned=False,
                    views_count=95
                )
                db.add(p3)
                db.flush()

                db.add(Reaction(user_id=faculty_user.id, post_id=p3.id, reaction_type=ReactionType.INTERESTING))

        # 6. Seed Academic Polls
        now = datetime.now(timezone.utc)
        poll1_q = "Preferred Midterm Lab Review Slot"
        poll1 = db.query(Poll).filter(Poll.question == poll1_q).first()
        if not poll1:
            poll1 = Poll(
                question=poll1_q,
                is_multiple_choice=False,
                expires_at=now + timedelta(days=7),
                created_by_id=faculty_user.id
            )
            db.add(poll1)
            db.flush()

            opt1 = PollOption(poll_id=poll1.id, text="Slot A: Friday 4:00 PM - 6:00 PM", order=0)
            opt2 = PollOption(poll_id=poll1.id, text="Slot B: Saturday 10:00 AM - 12:00 PM", order=1)
            opt3 = PollOption(poll_id=poll1.id, text="Slot C: Sunday 2:00 PM - 4:00 PM", order=2)
            db.add_all([opt1, opt2, opt3])
            db.flush()

            # Seed votes from Aarav (student) and Faculty
            db.add(PollVote(poll_id=poll1.id, option_id=opt1.id, user_id=student_user.id))
            db.add(PollVote(poll_id=poll1.id, option_id=opt2.id, user_id=faculty_user.id))

        poll2_q = "Which AI Framework do you prefer for VI Sem Capstone Projects?"
        poll2 = db.query(Poll).filter(Poll.question == poll2_q).first()
        if not poll2:
            poll2 = Poll(
                question=poll2_q,
                is_multiple_choice=True,
                expires_at=now + timedelta(days=14),
                created_by_id=student_user.id
            )
            db.add(poll2)
            db.flush()

            o1 = PollOption(poll_id=poll2.id, text="PyTorch 2.x", order=0)
            o2 = PollOption(poll_id=poll2.id, text="TensorFlow & Keras", order=1)
            o3 = PollOption(poll_id=poll2.id, text="Hugging Face Transformers", order=2)
            o4 = PollOption(poll_id=poll2.id, text="JAX / Flax", order=3)
            db.add_all([o1, o2, o3, o4])
            db.flush()

            # Student voted PyTorch and Hugging Face (multi-choice)
            db.add(PollVote(poll_id=poll2.id, option_id=o1.id, user_id=student_user.id))
            db.add(PollVote(poll_id=poll2.id, option_id=o3.id, user_id=student_user.id))

        # 7. Seed Campus Events
        ev1_title = "HackCampus 2026: 24h University Hackathon"
        ev1 = db.query(Event).filter(Event.title == ev1_title).first()
        if not ev1:
            ev1 = Event(
                title=ev1_title,
                description="Join 150+ students across departments for a 24-hour sprint building real-world solutions for campus automation, healthcare AI, and sustainable energy. Mentorship provided by alumni and cloud credits provided.",
                category="HACKATHON",
                venue="Campus Innovation Lab & Block B Auditorium",
                start_time=now + timedelta(days=4, hours=9),
                end_time=now + timedelta(days=5, hours=9),
                registration_deadline=now + timedelta(days=3, hours=23),
                max_capacity=160,
                current_registrations=1,
                banner_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
                organizer_id=faculty_user.id,
                status="PUBLISHED"
            )
            db.add(ev1)
            db.flush()

            # Register student_user
            db.add(EventRegistration(
                event_id=ev1.id,
                user_id=student_user.id,
                status="CONFIRMED"
            ))

        ev2_title = "AI & LLMs Architecture Symposium"
        ev2 = db.query(Event).filter(Event.title == ev2_title).first()
        if not ev2:
            ev2 = Event(
                title=ev2_title,
                description="A deep technical seminar on transformer inference optimization, speculative decoding, and retrieval-augmented generation (RAG) pipelines in production environments.",
                category="SEMINAR",
                venue="Auditorium 1, Technical Block",
                start_time=now + timedelta(days=10, hours=14),
                end_time=now + timedelta(days=10, hours=17),
                registration_deadline=now + timedelta(days=9),
                max_capacity=100,
                current_registrations=0,
                banner_url="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80",
                organizer_id=faculty_user.id,
                status="PUBLISHED"
            )
            db.add(ev2)

        ev3_title = "Full-Stack System Design & Microservices Workshop"
        ev3 = db.query(Event).filter(Event.title == ev3_title).first()
        if not ev3:
            ev3 = Event(
                title=ev3_title,
                description="Hands-on architecture session covering database sharding, connection pooling, Redis caching patterns, and asynchronous messaging with FastAPI and PostgreSQL.",
                category="WORKSHOP",
                venue="CSE Advanced Computer Lab 3",
                start_time=now + timedelta(days=14, hours=10),
                end_time=now + timedelta(days=14, hours=13),
                registration_deadline=now + timedelta(days=13),
                max_capacity=45,
                current_registrations=0,
                banner_url="https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&auto=format&fit=crop&q=80",
                organizer_id=faculty_user.id,
                status="PUBLISHED"
            )
            db.add(ev3)

        # 8. Seed Official Announcements
        ann1_title = "Spring Midterm Examination Schedule & Review Pods Published"
        ann1 = db.query(Announcement).filter(Announcement.title == ann1_title).first()
        if not ann1:
            ann1 = Announcement(
                title=ann1_title,
                content="The Department of Computer Science & Engineering has finalized the VI Semester Midterm Examination schedule. Review pods and mock tests will be held in the central library labs. Students are advised to verify their seating roll allocations on the notice board before Friday.",
                priority="URGENT",
                scope="GLOBAL",
                target_department="Computer Science & Engineering",
                author_id=faculty_user.id,
                is_pinned=True,
                expires_at=now + timedelta(days=30)
            )
            db.add(ann1)

        ann2_title = "Final Year Placement Recruitment Mock Interviews Commence This Weekend"
        ann2 = db.query(Announcement).filter(Announcement.title == ann2_title).first()
        if not ann2:
            ann2 = Announcement(
                title=ann2_title,
                content="Training & Placement Cell (TPO) announces mandatory mock technical interviews and resume reviews for eligible CSE and IT students. Slot bookings are open in the placement portal. Bring 2 hard copies of your updated resume.",
                priority="HIGH",
                scope="DEPARTMENT",
                target_department="Computer Science & Engineering",
                author_id=faculty_user.id,
                is_pinned=False,
                expires_at=now + timedelta(days=14)
            )
            db.add(ann2)

        ann3_title = "Campus Innovation Lab Extended Access Hours During Hackathon"
        ann3 = db.query(Announcement).filter(Announcement.title == ann3_title).first()
        if not ann3:
            ann3 = Announcement(
                title=ann3_title,
                content="To support students participating in the upcoming 24h Hackathon, the Campus Innovation Lab and High-Performance Compute Cluster will remain open 24/7 with faculty and staff supervision. High-speed network access and refreshments will be provided.",
                priority="NORMAL",
                scope="GLOBAL",
                author_id=admin_user.id,
                is_pinned=False,
                expires_at=now + timedelta(days=20)
            )
            db.add(ann3)

        # 9. Seed In-App Notifications for Student
        n1 = db.query(Notification).filter(Notification.title == "Comment on your discussion").first()
        if not n1 and student_user:
            n1 = Notification(
                user_id=student_user.id,
                actor_id=faculty_user.id if faculty_user else None,
                title="Comment on your discussion",
                message="Prof. Rajesh Sharma commented on your post 'Open-sourcing Benchpost'",
                type="COMMENT_REPLY",
                link="/discussions",
                is_read=False
            )
            n2 = Notification(
                user_id=student_user.id,
                actor_id=faculty_user.id if faculty_user else None,
                title="Event RSVP Confirmed",
                message="Your seat for 'HackCampus 2026: 24h University Hackathon' is confirmed.",
                type="EVENT_RSVP",
                link="/events",
                is_read=False
            )
            n3 = Notification(
                user_id=student_user.id,
                actor_id=admin_user.id if admin_user else None,
                title="New Official Announcement",
                message="Midterm Examination Schedule has been published for CSE students.",
                type="ANNOUNCEMENT",
                link="/announcements",
                is_read=True
            )
            db.add_all([n1, n2, n3])

        # 10. Seed Sample Moderation Report & Audit Trail
        r1 = db.query(Report).first()
        if not r1 and student_user and p1:
            r1 = Report(
                reporter_id=student_user.id,
                target_type="POST",
                target_id=p1.id,
                reason="INAPPROPRIATE",
                details="Testing moderation reporting queue for B.Tech project review.",
                status="PENDING",
                action_taken="NONE"
            )
            db.add(r1)

        a1 = db.query(AuditLog).first()
        if not a1 and admin_user:
            a1 = AuditLog(
                actor_id=admin_user.id,
                action="SYSTEM_INITIALIZE",
                target_type="PLATFORM",
                target_id="system-root",
                details="Initial platform verification, security policies, and standard community rosters initialized.",
                ip_address="127.0.0.1"
            )
            db.add(a1)

        db.commit()
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    init_db()
    print("Database seeded with Admin, Faculty, Student, initial communities, and discussion posts successfully!")
