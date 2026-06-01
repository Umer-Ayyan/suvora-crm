"use client";

export default function DeleteLead({
  id,
}: {
  id: string;
}) {
  async function handleDelete() {
    await fetch(`/api/leads/${id}`, {
      method: "DELETE",
    });

    window.location.reload();
  }

  return (
    <button
      onClick={handleDelete}
      className="w-full mt-3 bg-red-500 hover:bg-red-600 transition text-white px-4 py-3 rounded-xl font-semibold"
    >
      Delete
    </button>
  );
}