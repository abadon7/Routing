const VALID_VIEWS = [
    "calendar",
    "congregations",
    "assemblies",
    "speakers",
    "reports",
    "assembly-details",
];

const buildHash = (view, params = {}) => {
    if (view === "assembly-details") {
        const id = params.assemblyId;
        if (!id) return "#/assemblies";
        const day = params.day;
        let path = `#/assembly/${encodeURIComponent(id)}`;
        if (day && Number(day) !== 1) path += `/${Number(day)}`;
        return path;
    }
    return `#/${view}`;
};

export const parseRoute = () => {
    const raw = window.location.hash.replace(/^#/, "");
    const segments = raw.split("/").filter(Boolean);

    if (segments.length === 0) {
        return { view: "calendar", day: 1, assemblyId: null };
    }

    const [first] = segments;

    if (first === "assembly") {
        const assemblyId = segments[1] ? decodeURIComponent(segments[1]) : null;
        const day = segments[2] ? parseInt(segments[2], 10) : 1;
        if (!assemblyId) {
            return { view: "assemblies", day: 1, assemblyId: null };
        }
        return {
            view: "assembly-details",
            assemblyId,
            day: Number.isFinite(day) && day > 0 ? day : 1,
        };
    }

    if (VALID_VIEWS.includes(first)) {
        return { view: first, day: 1, assemblyId: null };
    }

    return { view: "calendar", day: 1, assemblyId: null };
};

export const navigate = (view, params = {}) => {
    const target = buildHash(view, params);
    if (window.location.hash === target) {
        window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else {
        window.location.hash = target;
    }
};

export const currentPath = () =>
    window.location.hash || buildHash("calendar");

export const onRouteChange = (cb) => {
    window.addEventListener("hashchange", cb);
};
