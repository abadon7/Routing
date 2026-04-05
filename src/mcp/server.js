import process from "node:process";
import { getMcpConfig } from "./config.js";
import { getCalendarWeek, listCalendarWeeks, searchActivitiesForUser, summarizeCalendarRange } from "./calendar-data.js";

const config = getMcpConfig();
const protocolVersion = '2024-11-05';

const tools = [
    {
        name: 'calendar_list_weeks',
        description: 'List service weeks for a calendar month range, including scheduled and open weeks.',
        inputSchema: {
            type: 'object',
            properties: {
                month: { type: 'string', description: 'Calendar month in YYYY-MM format.' },
                range_months: { type: 'integer', description: 'How many months to include. Supported values are 1, 3, or 6.', default: 1 }
            },
            required: ['month']
        }
    },
    {
        name: 'calendar_get_week',
        description: 'Fetch the activity details for a specific service week.',
        inputSchema: {
            type: 'object',
            properties: {
                week_start: { type: 'string', description: 'Service week start date in YYYY-MM-DD format.' }
            },
            required: ['week_start']
        }
    },
    {
        name: 'calendar_summary',
        description: 'Summarize scheduled and open weeks for a calendar month range.',
        inputSchema: {
            type: 'object',
            properties: {
                month: { type: 'string', description: 'Calendar month in YYYY-MM format.' },
                range_months: { type: 'integer', description: 'How many months to include. Supported values are 1, 3, or 6.', default: 1 }
            },
            required: ['month']
        }
    },
    {
        name: 'calendar_search',
        description: 'Search calendar activities by type, congregation name, or notes.',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search text.' },
                month: { type: 'string', description: 'Optional calendar month in YYYY-MM format.' },
                range_months: { type: 'integer', description: 'Optional month range when month is provided.', default: 1 }
            },
            required: ['query']
        }
    }
];

const resources = [
    {
        uri: 'calendar://info',
        name: 'Calendar MCP Info',
        description: 'Explains the available calendar consultation tools and the configured access model.',
        mimeType: 'application/json'
    }
];

const createToolResult = (payload) => ({
    content: [
        {
            type: 'text',
            text: JSON.stringify(payload, null, 2)
        }
    ],
    structuredContent: payload
});

const methodHandlers = {
    initialize: async () => ({
        protocolVersion,
        capabilities: {
            tools: {},
            resources: {}
        },
        serverInfo: {
            name: 'routing-calendar-mcp',
            version: '0.2.0'
        }
    }),
    'notifications/initialized': async () => null,
    ping: async () => ({ ok: true }),
    'tools/list': async () => ({ tools }),
    'resources/list': async () => ({ resources }),
    'resources/read': async ({ uri }) => {
        if (uri !== 'calendar://info') {
            throw new Error(`Unknown resource: ${uri}`);
        }
        const payload = {
            access: 'read-only',
            target_user_uid: config.calendarUserUid,
            auth_mode: 'firebase-admin',
            tools: tools.map((tool) => tool.name),
            notes: 'This local MCP server consults the configured user calendar from Firestore using Firebase Admin SDK.'
        };
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(payload, null, 2)
                }
            ]
        };
    },
    'tools/call': async ({ name, arguments: args = {} }) => {
        switch (name) {
            case 'calendar_list_weeks': {
                const rangeMonths = Number(args.range_months || 1);
                const payload = await listCalendarWeeks(config.admin, config.calendarUserUid, args.month, rangeMonths);
                return createToolResult(payload);
            }
            case 'calendar_get_week': {
                const payload = await getCalendarWeek(config.admin, config.calendarUserUid, args.week_start);
                return createToolResult(payload);
            }
            case 'calendar_summary': {
                const rangeMonths = Number(args.range_months || 1);
                const payload = await summarizeCalendarRange(config.admin, config.calendarUserUid, args.month, rangeMonths);
                return createToolResult(payload);
            }
            case 'calendar_search': {
                const rangeMonths = Number(args.range_months || 1);
                const monthDate = args.month ? new Date(`${args.month}-01T00:00:00`) : null;
                const payload = {
                    query: args.query,
                    results: await searchActivitiesForUser(config.admin, config.calendarUserUid, args.query, monthDate, rangeMonths)
                };
                return createToolResult(payload);
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
};

let buffer = '';

const writeMessage = (message) => {
    const body = JSON.stringify(message);
    process.stdout.write(`Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`);
};

const parseMessages = () => {
    while (true) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;

        const header = buffer.slice(0, headerEnd);
        const match = header.match(/Content-Length:\s*(\d+)/i);
        if (!match) {
            throw new Error('Missing Content-Length header');
        }

        const contentLength = Number(match[1]);
        const messageStart = headerEnd + 4;
        const messageEnd = messageStart + contentLength;
        if (buffer.length < messageEnd) return;

        const body = buffer.slice(messageStart, messageEnd);
        buffer = buffer.slice(messageEnd);
        const request = JSON.parse(body);
        handleRequest(request).catch((error) => {
            if (request.id !== undefined) {
                writeMessage({
                    jsonrpc: '2.0',
                    id: request.id,
                    error: { code: -32000, message: error.message }
                });
            }
        });
    }
};

const handleRequest = async (request) => {
    const handler = methodHandlers[request.method];
    if (!handler) {
        if (request.id !== undefined) {
            writeMessage({
                jsonrpc: '2.0',
                id: request.id,
                error: { code: -32601, message: `Method not found: ${request.method}` }
            });
        }
        return;
    }

    const result = await handler(request.params || {});
    if (request.id !== undefined && result !== null) {
        writeMessage({ jsonrpc: '2.0', id: request.id, result });
    }
};

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
    buffer += chunk;
    parseMessages();
});

process.stdin.on('error', (error) => {
    console.error(error);
    process.exit(1);
});
