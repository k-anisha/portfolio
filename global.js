// // console.log('IT’S ALIVE!');

// // function $$(selector, context = document) {
// //   return Array.from(context.querySelectorAll(selector));
// // }

// // let pages = [
// //   { url: 'index.html', title: 'Home' },
// //   { url: 'projects/', title: 'Projects' },
// //   {url: 'resume/', title: 'Resume' },
// //   {url: 'contact/', title: 'Contact '}
// // ];

// // const BASE_PATH =
// //   (location.hostname === "localhost" || location.hostname === "127.0.0.1")
// //     ? "/"
// //     : "/portfolio/"; 

// // let nav = document.createElement('nav');
// // document.body.prepend(nav);

// // for (let p of pages) {
// //   let url = p.url;
// //   let title = p.title;

// //   url = !url.startsWith('http') ? BASE_PATH + url : url;

// //   nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
// // }

// // for (let p of pages) {
// //   let url = p.url;
// //   let title = p.title;

// //   let a = document.createElement('a');
// //   a.href = url;
// //   a.textContent = title;

// //   nav.append(a);
// // }

// // const navLinks = $$("nav a");

// // let currentLink = navLinks.find(
// //   (a) => a.host === location.host && a.pathname === location.pathname
// // );

// // currentLink?.classList.add('current');


// console.log('IT’S ALIVE!');

// function $$(selector, context = document) {
//   return Array.from(context.querySelectorAll(selector));
// }

// let pages = [
//   { url: 'index.html', title: 'Home' },
//   { url: 'projects/index.html', title: 'Projects' },
//   { url: 'resume/index.html', title: 'Resume' },
//   { url: 'contact/index.html', title: 'Contact' }
// ];

// let nav = document.createElement('nav');
// document.body.prepend(nav);

// for (let p of pages) {
//   let a = document.createElement('a');
//   a.href = BASE_PATH + p.url;
//   a.textContent = p.title;
//   nav.append(a);
// }

// const navLinks = $$("nav a");

// let currentLink = navLinks.find((a) => {
//   return (
//     a.pathname === location.pathname ||
//     (location.pathname === '/' && a.pathname.endsWith('index.html'))
//   );
// });

// currentLink?.classList.add('current');

console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'projects/index.html', title: 'Projects' },
  { url: 'resume/index.html', title: 'Resume' },
  { url: 'contact/index.html', title: 'Contact' }
];

const BASE_PATH =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"
    : "/portfolio/";

let nav = document.createElement('nav');
document.body.prepend(nav);

document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="auto">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

let select = document.querySelector(".color-scheme select");

if ("colorScheme" in localStorage) {
  let scheme = localStorage.colorScheme;

  document.documentElement.style.setProperty("color-scheme", scheme);

  select.value = scheme;
}

select.addEventListener("input", (event) => {
  console.log("color scheme changed to", event.target.value);

  document.documentElement.style.setProperty(
    "color-scheme",
    event.target.value
  );

  localStorage.colorScheme = event.target.value;
});

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  let fullURL = url.startsWith('http') ? url : BASE_PATH + url;

  let a = document.createElement('a');
  a.href = fullURL;
  a.textContent = title;

  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

const navLinks = $$("nav a");

let currentLink = navLinks.find((a) =>
  a.pathname === location.pathname
);

currentLink?.classList.add('current');

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';

  project.map((p) => {
    const article = document.createElement('article');
    article.innerHTML = `
    <${headingLevel}>${p.title}</${headingLevel}>
    <img src="${p.image}" alt="${p.title}">
    <p>${p.description}</p>
  `;
    containerElement.appendChild(article);
  })
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
