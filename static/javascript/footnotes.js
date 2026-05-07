// Footnote Backlinking
document.addEventListener("DOMContentLoaded", (_event) => {
  const references = document.getElementsByClassName("footnote-reference");

  for (const reference of references) {
    const link = reference.firstChild;
    const id = link.getAttribute("href").slice(1);
    link.setAttribute("id", `${id}_ref`);
  }

  const footnotes = document.getElementsByClassName("footnote-definition");

  for (const footnote of footnotes) {
    const id = footnote.getAttribute("id");
    const backReference = document.createElement("a");
    backReference.setAttribute("href", `#${id}_ref`);
    backReference.textContent = "↩";
    const footnoteParagraph = footnote.getElementsByTagName("p")[0];
    footnoteParagraph.append(backReference);
  }
});
