// Screenshots shown on the page (files in public/nexavideo/shots/, captured from the real app on a cloud phone).
// The first one is the phone mockup in the hero. tall = full phone screen, else a wider crop.
export const SHOTS: { src: string; caption: string; tall?: boolean }[] = [
  { src: "/nexavideo/shots/home.jpg", caption: "Home — trending now, IMDb ratings, trailers", tall: true },
  { src: "/nexavideo/shots/rows.jpg", caption: "Trending movies & TV you can watch right now", tall: true },
  { src: "/nexavideo/shots/title.jpg", caption: "Every title — rating, age rating, seasons", tall: true },
  { src: "/nexavideo/shots/cast.jpg", caption: "Cast, creators and episodes", tall: true },
  { src: "/nexavideo/shots/episodes.jpg", caption: "Download episodes — no more buffering", tall: true },
  { src: "/nexavideo/shots/downloads.jpg", caption: "Your downloads, ready to play offline" },
  { src: "/nexavideo/shots/top-rated.jpg", caption: "Top rated movies & TV of all time", tall: true },
  { src: "/nexavideo/shots/search.jpg", caption: "Search as you type", tall: true },
];
