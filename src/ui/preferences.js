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
    document.documentElement.classList.remove('foundation-design');
    if (design === 'foundation') {
        document.documentElement.classList.add('foundation-design');
    }
};

export const getNextDesign = (currentDesign) => {
    const nextDesign = currentDesign === 'default' ? 'foundation' : 'default';
    localStorage.design = nextDesign;
    return nextDesign;
};
