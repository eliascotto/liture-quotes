import StarIcon from '@icons/Star';

function StarredButton({ onClick, isActive }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors duration-200 ${
        isActive
          ? 'text-cyan-400 bg-slate-700/10'
          : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-700/50'
      }`}
      title="Starred Notes"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
        <path strokeLinecap="butt" strokeLinejoin="bevel" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    </button>
  );
}

export default StarredButton; 
