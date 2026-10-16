export default {
  fetch(request) {
    const canonicalUrl = new URL(request.url)
    canonicalUrl.hostname = 'easyshowtech.com'
    return Response.redirect(canonicalUrl.toString(), 301)
  },
}
