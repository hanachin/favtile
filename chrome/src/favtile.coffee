x = (xpath) ->
  args = [xpath, document, null, XPathResult.ANY_TYPE, null]
  snapshot = document.evaluate args...
  nodes = []
  nodes.push node while node = snapshot.iterateNext()
  nodes

favtile_link = (screen_name) ->
  host = "http://favtile.com/"
  chrome_ext = "chrome-extension://dgllafjkaenhcopbiockdiibjkfgkago"

  fav_on = "#{chrome_ext}/fav18x18on.png"
  fav_off = "#{chrome_ext}/fav18x18off.png"
  link = $("<a>").attr(class:"favtile", href: "#{host}#{screen_name}", target:"_blank")

  icon = $("<img>").attr(src:fav_off, width: 18, height: 18)
  icon.mouseover -> $(this).attr(src: fav_on)
  icon.mouseout -> $(this).attr(src: fav_off)

  link.append(icon)

addFavtileLink = ->
  xpath = "//span[@class='tweet-user-name' and count(./a[@class='favtile'])=0]//a"
  screen_names = (screen_name for screen_name in x(xpath) when $(screen_name).text() isnt "")
  for screen_name in screen_names
    $(screen_name).before(favtile_link($(screen_name).text()))

setInterval(addFavtileLink, 500)
