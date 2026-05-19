export const getStoredDesign = () => localStorage.design || 'default';

export const initTheme = () => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

export const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
};

export const applyDesign = (design) => {
    document.documentElement.classList.remove('foundation-design', 'tactician-design');
    if (design === 'foundation') {
        document.documentElement.classList.add('foundation-design');
    } else if (design === 'tactician') {
        document.documentElement.classList.add('tactician-design');
    }
};

export const getNextDesign = (currentDesign) => {
    const designs = ['default', 'foundation', 'tactician'];
    const currentIndex = designs.indexOf(currentDesign);
    const nextDesign = designs[(currentIndex + 1) % designs.length];
    localStorage.design = nextDesign;
    return nextDesign;
};
