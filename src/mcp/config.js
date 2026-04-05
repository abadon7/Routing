import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const parseEnvFile = (filePath) => {
    if (!fs.existsSync(filePath)) return {};
    return fs.readFileSync(filePath, 'utf8')
        .split(/\r?\n/)
        .reduce((acc, line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return acc;
            const separator = trimmed.indexOf('=');
            if (separator === -1) return acc;
            const key = trimmed.slice(0, separator).trim();
            const value = trimmed.slice(separator + 1).trim();
            acc[key] = value.replace(/^"|"$/g, '');
            return acc;
        }, {});
};

const loadLocalEnv = () => {
    const envFiles = ['.env', '.env.local'];
    const merged = {};
    envFiles.forEach((name) => Object.assign(merged, parseEnvFile(path.join(repoRoot, name))));
    Object.entries(merged).forEach(([key, value]) => {
        if (!(key in process.env)) {
            process.env[key] = value;
        }
    });
};

const resolveServiceAccountPath = (serviceAccountPath) => {
    if (!serviceAccountPath) return null;
    return path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.resolve(repoRoot, serviceAccountPath);
};

const getAdminCredentialConfig = () => {
    const serviceAccountPath = resolveServiceAccountPath(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH);
    if (serviceAccountPath) {
        if (!fs.existsSync(serviceAccountPath)) {
            throw new Error(`FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH does not exist: ${serviceAccountPath}`);
        }

        return {
            mode: 'service_account_file',
            serviceAccountPath
        };
    }

    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

    if (privateKey || clientEmail || projectId) {
        const missing = [
            !projectId && 'FIREBASE_ADMIN_PROJECT_ID',
            !clientEmail && 'FIREBASE_ADMIN_CLIENT_EMAIL',
            !privateKey && 'FIREBASE_ADMIN_PRIVATE_KEY'
        ].filter(Boolean);

        if (missing.length > 0) {
            throw new Error(`Incomplete Firebase Admin credentials: ${missing.join(', ')}`);
        }

        return {
            mode: 'inline_credentials',
            serviceAccount: {
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n')
            }
        };
    }

    throw new Error(
        'Missing Firebase Admin credentials. Set FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH or FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.'
    );
};

export const getMcpConfig = () => {
    loadLocalEnv();

    const missing = ['MCP_CALENDAR_USER_UID'].filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing MCP calendar configuration: ${missing.join(', ')}`);
    }

    const admin = getAdminCredentialConfig();

    return {
        admin,
        calendarUserUid: process.env.MCP_CALENDAR_USER_UID
    };
};
