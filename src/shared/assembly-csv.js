const FIELD_ORDER = [
    "day",
    "startTime",
    "outline",
    "duration",
    "theme",
    "source",
    "dateAssigned",
    "speakerName",
    "circuit",
    "congregation",
    "mobilePhone",
    "homePhone",
    "email",
    "address",
    "isVisitor",
    "isBethelite",
    "status",
    "speakerType",
    "extras",
];

const HEADER_ALIASES = {
    day: ["day", "día", "dia"],
    startTime: ["time", "start time", "starttime", "hora"],
    outline: ["outline", "outline number", "bosquejo"],
    duration: ["duration", "duration min", "duration minutes", "duración", "duracion"],
    theme: ["theme", "title", "talk", "tema", "título", "titulo"],
    source: ["source", "fuente"],
    dateAssigned: ["date assigned", "assigned date", "dateassigned", "fecha asignada"],
    speakerName: ["speaker", "speaker name", "speakername", "name", "orador", "nombre del orador"],
    circuit: ["circuit", "circuito"],
    congregation: ["congregation", "congregación", "congregacion"],
    mobilePhone: ["mobile", "mobile phone", "mobilephone", "cell", "celular", "teléfono móvil", "telefono movil"],
    homePhone: ["home phone", "homephone", "phone", "teléfono", "telefono", "teléfono casa", "telefono casa"],
    email: ["email", "e-mail", "correo", "correo electrónico", "correo electronico"],
    address: ["address", "dirección", "direccion"],
    isVisitor: ["visitor", "is visitor", "visitor y/n", "visitante"],
    isBethelite: ["bethelite", "is bethelite", "bethelite y/n"],
    status: ["status", "confirmed", "status or confirmed", "estado", "confirmado"],
    speakerType: ["speaker type", "speakertype", "speaker category", "tipo de orador"],
    extras: ["extras", "extra", "notes", "notas"],
};

const normalizeHeader = (value) => (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();

const aliasToField = new Map(
    Object.entries(HEADER_ALIASES).flatMap(([field, aliases]) =>
        aliases.map((alias) => [normalizeHeader(alias), field]),
    ),
);

const parseDelimitedText = (text) => {
    const firstLine = String(text).split(/\r?\n/, 1)[0] || "";
    const delimiter = firstLine.includes("\t") ? "\t" : ",";
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (let index = 0; index < String(text).length; index += 1) {
        const character = String(text)[index];
        if (character === '"') {
            if (quoted && String(text)[index + 1] === '"') {
                value += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
        } else if (!quoted && character === delimiter) {
            row.push(value.trim());
            value = "";
        } else if (!quoted && (character === "\n" || character === "\r")) {
            if (character === "\r" && String(text)[index + 1] === "\n") index += 1;
            row.push(value.trim());
            if (row.some((part) => part !== "")) rows.push(row);
            row = [];
            value = "";
        } else {
            value += character;
        }
    }
    row.push(value.trim());
    if (row.some((part) => part !== "")) rows.push(row);
    return rows;
};

const isTruthyFlag = (value) => ["y", "yes", "true", "1", "sí", "si"].includes(
    (value || "").trim().toLowerCase(),
);

const parseStatus = (value) => {
    const normalized = (value || "").trim().toLowerCase();
    if (["confirmed", "confirm", "yes", "y", "true", "1", "sí", "si"].includes(normalized)) return "Confirmed";
    if (["cancelled", "canceled", "cancel", "no", "n", "false", "0"].includes(normalized)) return "Cancelled";
    return "Pending";
};

const cleanValue = (value) => {
    const cleaned = (value || "").trim();
    return cleaned === "-" ? "" : cleaned;
};

export const parseAssemblyCsv = (text, currentDay = 1) => {
    const rows = parseDelimitedText(text);
    if (rows.length === 0) return [];

    const headerFields = rows[0].map((header) => aliasToField.get(normalizeHeader(header)) || null);
    const hasHeader = headerFields.some(Boolean);
    const dataRows = hasHeader ? rows.slice(1) : rows;

    return dataRows.map((parts) => {
        const values = hasHeader
            ? Object.fromEntries(headerFields.map((field, index) => field ? [field, cleanValue(parts[index])] : []).filter(Boolean))
            : Object.fromEntries(FIELD_ORDER.map((field, index) => [field, cleanValue(parts[index])]));
        const day = Number.parseInt(values.day, 10);
        const duration = Number.parseInt(values.duration, 10);
        const hasData = Object.values(values).some(Boolean);
        if (!hasData) return null;

        const talkData = {
            day: Number.isFinite(day) ? day : currentDay,
            startTime: values.startTime || "00:00",
            outline: values.outline || "",
            theme: values.theme || "",
            title: values.theme || values.outline || "",
            source: values.source || "",
            dateAssigned: values.dateAssigned || "",
            speakerId: "",
            speakerName: values.speakerName || null,
            speakerType: values.speakerType || "",
            extras: values.extras || "",
            circuit: values.circuit || "",
            congregation: values.congregation || "",
            mobilePhone: values.mobilePhone || "",
            homePhone: values.homePhone || "",
            email: values.email || "",
            address: values.address || "",
            isVisitor: isTruthyFlag(values.isVisitor),
            isBethelite: isTruthyFlag(values.isBethelite),
            status: parseStatus(values.status),
        };
        if (Number.isFinite(duration)) talkData.duration = duration;
        return talkData;
    }).filter(Boolean);
};
