import PromptDetail from "@/components/PromptDetail";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PromptPage({
  params
}: Props) {
  const { id } = await params;

  return (
    <PromptDetail promptId={id} />
  );
}
