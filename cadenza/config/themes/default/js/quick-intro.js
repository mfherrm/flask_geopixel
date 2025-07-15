const startpageNavigationSelector = '.startpage-section-navigation';
const scrollDownSectionSelector = '.welcome-section .scroll-down';

document.addEventListener('DOMContentLoaded', () => {
  setupQuickIntro();
});

function setupQuickIntro () {
  // when this window width is reached the navbar is only shown when user scrolls down
  const WINDOW_WIDTH_TO_SHOW_NAVBAR_ONLY_ON_SCROLL = 1024;
  // amount of pixels needed to be scrolled to show the menu
  const SCROLL_OFFSET_TO_TRIGGER_MENU = 10;

  const sections = document.querySelectorAll("[id^='section-']");
  // since we have height 100% on the container, it scrolls instead of the document
  const pageContent = document.querySelector('.d-page--content');

  setupFirstStepsScrollDownArea();
  setupNavbar();

  function setupFirstStepsScrollDownArea () {
    const scrollDownArea = document.querySelector(scrollDownSectionSelector);
    if (scrollDownArea) {
      scrollDownArea.addEventListener('click', () => {
        smoothlyScrollElementIntoView(sections[1]);
      });
    }
  }

  function setupNavbar () {
    const navBar = document.querySelector(startpageNavigationSelector);
    createNavbarItems();

    const menuItems = document.querySelectorAll('.startpage-section-navigation-item');
    let activeMenuItem = menuItems[0];
    activeMenuItem?.classList.add('active');
    let nextActiveMenuItem = menuItems[0];

    function createNavbarItems () {
      // Currently, the quick intro is only available in german. Also we don't use
      // Webpack in Cadenza_Web, therefore the aria label resources are provided as list.
      // See welcome_de.html
      const accessibleLabels = [
        'Home',
        '1 Startseite',
        '2 Navigator',
        '3 Demo-Inhalte',
        '4 Arbeitsmappen',
        '5 Arbeitsblätter',
        '6 Dashboard',
        '7 Daten filtern'
      ];
      sections.forEach((section, index) => {
        const item = document.createElement('a');
        item.href = `#section-${index}`;
        item.classList.add('startpage-section-navigation-item');
        item.textContent = (index === 0 ? '' : index);
        item.setAttribute('aria-label', accessibleLabels[index]); // FF does not support item.ariaLabel
        if (index === 0) {
          createNavbarHomeIcon(item);
        }
        navBar.append(item);
      });
    }

    function createNavbarHomeIcon (item) {
      const primaryColor = window.Disy.theme['primary-color'];
      const homeIconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path fill="${primaryColor}" d="M19.5 21h-15A1.5 1.5 0 013 19.5V10a1 1 0 01.4-.8l8-6a1 1 0 011.2 0l8 6a1 1 0 01.4.8v9.5a1.5 1.5 0 01-1.5 1.5zM5 19h14v-8.5l-7-5.25-7 5.25z"/>
        </svg>`;
      item.style.background = `center / 24px 24px no-repeat url('data:image/svg+xml;base64,${btoa(homeIconSvg)}') var(--gray-01)`;
    }

    function updateNavbarVisibility () {
      if (navBar && window.innerWidth > WINDOW_WIDTH_TO_SHOW_NAVBAR_ONLY_ON_SCROLL
        && pageContent.scrollTop < SCROLL_OFFSET_TO_TRIGGER_MENU) {
        navBar.style.opacity = 0;
        navBar.style.right = '-32px';
      } else {
        navBar.style.opacity = 1;
        navBar.style.right = '10px';
      }
    }

    function markActiveMenuItem () {
      // when this amount of space above a section is scrolled to that section is considered to be "active"
      const offsetToActivateSection = window.innerHeight * 0.25;
      for (const [ index, section ] of sections.entries()) {
        const top = section.getBoundingClientRect().top;
        if (top < offsetToActivateSection) {
          nextActiveMenuItem = menuItems[index];
        }
      }

      if (activeMenuItem.textContent !== nextActiveMenuItem.textContent) {
        nextActiveMenuItem.classList.add('active');
        activeMenuItem.classList.remove('active');
        activeMenuItem = nextActiveMenuItem;
      }
    }

    const throttledUpdateMenu = throttle(() => {
      updateNavbarVisibility();
      markActiveMenuItem();
    });

    pageContent.addEventListener('scroll', throttledUpdateMenu);
    window.addEventListener('resize', throttledUpdateMenu);

    navBar.addEventListener('click', (event) => {
      event.preventDefault();
      smoothlyScrollElementIntoView(document.querySelector(event.target.getAttribute('href')));
    });
  }
}

function smoothlyScrollElementIntoView (element) {
  element.scrollIntoView({
    behavior: 'smooth'
  });
}

// We cannot import throttle() into here, because this file is theme-specific.
function throttle (callback) {
  let waiting = false;
  return function () {
    if (!waiting) {
      callback.apply(this, arguments);
      waiting = true;
      setTimeout(() => { waiting = false; }, 5);
    }
  }
}
