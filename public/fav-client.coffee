$ = jQuery

twapi_url = (path, params) ->
  params = ("#{k}=#{encodeURIComponent v}" for own k, v of params).join("&")
  "https://api.twitter.com/1#{path}.json?include_entities=true&suppress_response_codes=true&#{params}&callback=?"

lookup_url = (screen_name) ->
  throw "screen_name is missing." unless screen_name
  if twitter
    "/api/lookup/#{encodeURIComponent screen_name}"
  else
    twapi_url "/users/lookup", screen_name:screen_name

favs_url = (id, page = 1) ->
  throw "twitter id is missing." unless id
  if twitter
    "/api/favs/#{encodeURIComponent id}/#{page}"
  else
    twapi_url "/favorites", id: id, page: page, count: 20

search_url = (q, page = 1) ->
  throw "search query is missing." unless q
  if twitter
    "/api/search/#{encodeURIComponent q}/#{page}"
  else
    twapi_url "/search", q: q, rpp: 100, result_type: "mixed"

dateformat = (d) ->
  date = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join "-"
  time = [d.getHours(), d.getMinutes(), d.getSeconds()].join ":"
  "#{date} #{time}"

twapi = (url, callback) ->
  $.getJSON url, (json) ->
    console.log json
    if json.errors?
      $("#error").append $("<p>").text "Error: #{error.message}" for error in json.errors
    else if json.error?
      $("#error").append $("<p>").text "Error: #{json.error}"
    else
      callback json

class Tweets extends Spine.Controller
  events:
    "click .fav_button": "fav"
    "click .retweet_button": "retweet"
  constructor: ->
    super
    @item.bind("update", @render)
    @item.bind("destroy", @release)

  decorate: (item) ->
    {text: text, entities: entities} = item
    v.type = t for v in values for own t, values of entities
    entities = (v for own t, v of entities).reduce(((a, b) -> a.concat b), []).sort (a, b) -> a.indices[0] - b.indices[0]

    el = $("<p>")
    pos = 0
    for e in entities
      el.append text.substr(pos, e.indices[0] - pos)
      pos = e.indices[1]
      sub = text.substr(e.indices[0], e.indices[1] - e.indices[0])
      el.append switch e.type
        when "urls" then $("<a>").attr(class: "urls", target: "_blank", href: e.expanded_url ? e.url).text e.display_url ? e.url
        when "user_mentions" then $("<a>").attr(class: "user_mentions", href: "/#{encodeURIComponent e.screen_name}").text sub
        when "hashtags" then $("<a>").attr(class: "hashtags", href: "/##{encodeURIComponent e.text}").text sub
        when "media" then $("<a>").attr(class: "media", target: "_blank", href: e.expanded_url ? e.url).text e.display_url ? e.url
        else
          console.log "unknown entity type", e
          sub
    el.append text.substr(pos)

    media = (e for e in entities when e.type is "media")
    for m in media
      sizes = width: m.sizes.thumb.w, height: m.sizes.thumb.h
      el.append $("<img>").attr(class: "media", src: "#{m.media_url}:thumb").css(sizes)
    el

  fav: (e) ->
    console.log @item.id_str

  retweet: (e) ->
    console.log @item.id_str

  render: =>
    @replace($("#tweetTemplate").tmpl(@item))
    $(@el).find(".item_content").replaceWith @decorate @item
    @

class Tweet extends Spine.Model
  dateformat: => dateformat new Date @created_at

class Search extends Tweet
  @configure "Search", "user", "text", "entities", "id_str", "created_at", "retweeted", "favorited", "from_user", "profile_image_url"
  constructor: (obj) ->
    super obj
    @user = screen_name: @from_user, profile_image_url: @profile_image_url

class Fav extends Tweet
  @configure "Tweet", "user", "text", "entities", "id_str", "created_at", "retweeted", "favorited"

class FavtileApp extends Spine.Controller
  events:
    "submit form": "userChange"
    "focus .screen_name_input": "active"
    "blur .screen_name_input": "inactive"

  elements:
    ".items": "items"
    ".screen_name_input": "screen_name_input"
    ".loading": "loading_img"

  constructor: ->
    super
    console.log "constructor of FavtileApp"
    Fav.bind("create", @addOne)
    Fav.fetch()
    Search.bind("create", @addSearchOne)
    Search.fetch()
    $(@items).masonry(itemSelector: ".item")

    @screen_name = /^\/(.*)/.exec(location.pathname)?.pop()

    if @screen_name
      @setUserInformation()

      # load next favs when detect scroll to bottom
      $(window).bottom()
      $(window).bind "bottom", @moreFavs

      # recent 20 favs
      twapi (favs_url @screen_name), (favs) =>
        console.log "favs"
        Fav.create fav for fav in favs
        if favs.length is 0 then $(@el).find(".loading_footer").text("0 favorites.")

    else if location.hash
      $(@screen_name_input).val decodeURIComponent location.hash
      twapi (search_url location.hash), (result) =>
        console.log result.results
        Search.create t for t in result.results
        if result.results.length is 0 then $(@el).find(".loading_footer").text("end of favotes.")
      $("header").append $("<a>").attr(href: "/").append $("<img>").attr class:"icon", src:"favicon73x73.png"
    else
      $("body").css("background-image", "url('top_background.png')")
      $("header").append $("<a>").attr(href: "/").append $("<img>").attr class:"icon", src:"favicon73x73.png"

    $(window).bind 'hashchange', =>
      console.log "hash change"
      Search.destroyAll()
      $(@screen_name_input).val decodeURIComponent location.hash
      twapi (search_url location.hash), (result) =>
        console.log result.results
        Search.create t for t in result.results

    @before_data = @screen_name
    @before_data or= location.hash

  active: =>
    @screen_name_input.addClass("active")

  inactive: =>
    @screen_name_input.removeClass("active")

  userChange: (e) =>
    e.preventDefault()
    console.log $(@screen_name_input).val()
    console.log @before_data
    if $(@screen_name_input).val() isnt @before_data
      location.href = "/#{$(@screen_name_input).val()}"

  addSearchOne: (search) =>
    view = new Tweets(item: search)
    el = view.render().el
    @items.append(el)
    $(@items).masonry("appended", el).masonry('reload')

  addOne: (fav) =>
    view = new Tweets(item: fav)
    el = view.render().el
    @items.append(el)
    $(@items).masonry("appended", el).masonry('reload')

  moreFavs: =>
    console.log "favs"
    @page ?= 1
    @loading ?= false
    unless @loading
      console.log "bottom"
      @loading = true
      $(@loading_img).toggle()
      twapi (favs_url @screen_name, ++@page), (favs) =>
        console.log "load"
        $(@loading_img).toggle()
        if favs.length isnt 0
          Fav.create fav for fav in favs
          @loading = false
        else
          console.log @el.find(".loading_footer").text("end of favotes.")

  setSearchInformation: =>
    $(@screen_name_input).val decodeURIComponent location.hash

  setUserInformation: =>
    set_bg = (user) =>
      $("body").css
        'background-image': "url(#{user.profile_background_image_url_https})"
        'background-repeat': if user.profile_background_tile then "repeat" else "no-repeat"
        'background-color': "##{user.profile_background_color}"
        'background-attachment': "fixed"
        'background-position': "0px 58px"

    set_icon = (user) ->
      $("header").append $("<img>").attr class:"icon", src:user.profile_image_url

    $(@screen_name_input).val @screen_name
    twapi (lookup_url @screen_name), (users) ->
      user = users[0]
      set_bg user
      set_icon user

$ ->
  new FavtileApp(el: $("#favs"))
