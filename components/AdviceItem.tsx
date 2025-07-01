'use client';

type AdviceItemProps = {
  title: string;
  description: string;
};

export default function AdviceItem({ title, description }: AdviceItemProps) {
  return (
    <div className="rounded-xl border p-4 bg-neutral-50">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm mt-1 text-muted-foreground">{description}</p>
    </div>
  );
}