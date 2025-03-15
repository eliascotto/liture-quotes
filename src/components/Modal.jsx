import { useEffect, useRef } from "react";


function Modal(props) {
  const { children, open, onClose, ...rest } = props;
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open) {
      dialog.showModal();
      dialog.dataset.open = "";
    } else {
      delete dialog.dataset.open;
      const handler = () => dialog.close();
      const inner = dialog.children[0];
      inner.addEventListener("transitionend", handler);
      return () => inner.removeEventListener("transitionend", handler);
    }
  }, [open]);

  return (
    <dialog ref={ref} {...rest}>
      <div className="fixed inset-0 grid place-content-center bg-black/75 opacity-0 transition-all group-data-[open]:opacity-100">
        <div className="w-full max-w-lg scale-75 bg-white p-4 opacity-0 shadow-lg transition-all group-data-[open]:scale-100 group-data-[open]:opacity-100">
          {children}
        </div>
      </div>
    </dialog>
  );
}

export default Modal;