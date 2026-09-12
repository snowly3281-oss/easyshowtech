export default {
  fetch(request) {
    const canonicalUrl = new URL(request.url)
    canonicalUrl.hostname = 'coralpilates.com'
    return Response.redirect(canonicalUrl.toString(), 301)
  },
}
