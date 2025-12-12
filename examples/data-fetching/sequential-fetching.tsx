// Quando um fetch depende do resultado do outro
export default async function UserPostsPage({ params }) {
  // Primeiro: busca o usuário
  const user = await getUser(params.id)

  // Depois: busca posts usando dados do usuário
  const posts = await getPostsByAuthor(user.authorId)

  return <PostList posts={posts} />
}