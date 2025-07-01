type AdviceListProps = {
  items: Array<{
    title: string;
    description: string;
  }>;
};

export default function AdviceList({ items }: AdviceListProps) {
  if (!items || !items.length) return null;

  return (
    <div className="space-y-4 mt-4">
      {items.map((item, index) => (
        <div key={item.title + index}>
          <h3 className="font-bold">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
      ))}
    </div>
  );
}