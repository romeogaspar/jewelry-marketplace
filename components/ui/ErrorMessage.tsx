export default function ErrorMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <p className="font-medium">{title}</p>
      <p>{message}</p>
    </div>
  );
}
