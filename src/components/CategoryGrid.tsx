// frontend/src/components/CategoryGrid.tsx

type Category = {
  id: string;
  name: string;
  iconUrl: string | null;
};

type Props = {
  categories: Category[];
};

export default function CategoryGrid({ categories }: Props) {
  if (categories.length === 0) {
    return <p>No categories available.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {categories.map((cat) => (
        <div
          key={cat.id}
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <strong>{cat.name}</strong>
        </div>
      ))}
    </div>
  );
}