interface SearchFormProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export function SearchForm({ label, value, onChange, onSearch }: SearchFormProps) {
  return <form role="search" aria-label={label} className="flex flex-1 gap-2 min-w-0"
    onSubmit={event => { event.preventDefault(); onSearch(); }}>
    <input type="search" aria-label={label} placeholder={label} value={value}
      onChange={event => onChange(event.target.value)}
      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-base" />
    <button className="search-action" type="submit">Search</button>
  </form>;
}
