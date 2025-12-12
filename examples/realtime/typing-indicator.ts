// Cliente: avisa que está digitando
function handleTyping() {
  pusherClient.channel(`chat-${chatId}`).trigger(
    'client-typing',
    { userName: user.name }
  )
}

// Cliente: escuta quem está digitando
channel.bind('client-typing', ({ userName }) => {
  setTypingUser(userName)
  setTimeout(() => setTypingUser(null), 2000)
})