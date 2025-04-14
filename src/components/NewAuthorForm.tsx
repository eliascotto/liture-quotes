import { useState } from "react";
import { useDialog } from "../context/DialogContext.tsx";
import Input from "@components/Input.tsx";
import Loading from "./icons/Loading.tsx";

interface NewAuthorFormProps {
  onSubmit: (name: string) => Promise<boolean>;
  onCancel: () => void;
}

function NewAuthorForm({ onSubmit, onCancel }: NewAuthorFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { closeDialog } = useDialog();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Validate
    if (!name.trim()) {
      setError("Author name is required");
      return;
    }

    if (name.trim().length < 2) {
      setError("Author name must be at least 2 characters");
      return;
    }

    // Submit
    setIsSubmitting(true);

    try {
      const success = await onSubmit(name.trim());

      if (success) {
        // Close dialog on success
        closeDialog();
      } else {
        // Reset submitting state if not successful
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting author:", error);
      setError("An error occurred while creating the author");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    closeDialog();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          id="author-name"
          label="Author Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="Enter author name"
          autoFocus
          disabled={isSubmitting}
          error={error}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 mt-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm bg-dialog-cancel-button hover:bg-dialog-cancel-button-hover 
                    text-dialog-foreground 
                    rounded-md transition-colors focus:outline-none focus:ring-2 
                    focus:ring-dialog-cancel-button-ring focus:ring-offset-2 
                    focus:ring-offset-dialog-background cursor-pointer"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-dialog-action-button hover:bg-dialog-action-button-hover
                     text-dialog-foreground-active
                    rounded-md transition-colors focus:outline-none focus:ring-2 
                    focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-dialog-background
                    flex items-center cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loading />
              Creating...
            </>
          ) : (
            "Add Author"
          )}
        </button>
      </div>
    </form>
  );
}

export default NewAuthorForm; 
