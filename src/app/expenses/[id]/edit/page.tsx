import EditExpensePage from './EditExpensePage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditExpensePage id={id} />
}
