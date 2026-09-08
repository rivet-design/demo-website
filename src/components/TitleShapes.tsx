/**
 * The warm brand cluster off the masthead's top-right corner, past the last
 * column. Its dark counterpart hangs off the hero picture and is positioned
 * against that picture instead, so it keeps its overlap.
 *
 * Positioned against the article, which is full-bleed, so its edges are the
 * viewport's — each shape walks out through the page margin with a plain
 * negative offset. html/body carry `overflow-x: clip`, so the overhang costs
 * no scrollbar, and `clip`, unlike `hidden`, leaves the sticky nav working.
 */
const TitleShapes = () => (
  <div aria-hidden className="title-shapes">
    <img
      src="/images/about/blob-union.svg"
      alt=""
      draggable={false}
      className="title-shapes__blob title-shapes__blob--right"
    />
  </div>
);

export default TitleShapes;
