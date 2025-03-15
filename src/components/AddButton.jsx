import PlusIcon from "./icons/Plus"

function AddButton(props) {
  const currentOptionName = props.selectedOption.slice(0, -1).toLowerCase()

  return (
    <div 
      className="bg-slate-800/50 hover:bg-slate-700/60 rounded-md p-1.5 cursor-pointer transition-all duration-200 text-slate-400 hover:text-cyan-300 border border-slate-700/30"
      title={`Add ${currentOptionName}`}
      onClick={props.onClick}
    >
      <PlusIcon />
    </div>
  )
}

export default AddButton
