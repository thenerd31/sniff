import * as tls from "tls";
import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard, CardSeverity } from "@/types";
import { classifyToolError } from "./error-classify";

interface SSLInfo {
  issuer: string;
  subject: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiry: number;
  selfSigned: boolean;
  protocol: string;
}

function checkSSL(hostname: string): Promise<SSLInfo> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.subject) {
          socket.destroy();
          return reject(new Error("No certificate found"));
        }

        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const daysUntilExpiry = Math.floor(
          (validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const issuerCN = cert.issuer?.CN || cert.issuer?.O || "Unknown";
        const subjectCN = cert.subject?.CN || hostname;
        const selfSigned = issuerCN === subjectCN;

        resolve({
          issuer: issuerCN,
          subject: subjectCN,
          validFrom,
          validTo,
          daysUntilExpiry,
          selfSigned,
          protocol: socket.getProtocol() || "unknown",
        });

        socket.destroy();
      }
    );

    socket.on("error", (err) => {
      socket.destroy();
      reject(err);
    });

    socket.setTimeout(10000, () => {
      socket.destroy();
      reject(new Error("SSL connection timed out"));
    });
  });
}

export async function sslAnalysis(url: string): Promise<EvidenceCard> {
  const hostname = new URL(url).hostname;

  try {
    const info = await checkSSL(hostname);

    let severity: CardSeverity = "safe";
    let title: string;
    const details: string[] = [];

    if (info.selfSigned) {
      severity = "critical";
      title = "Self-signed SSL certificate";
    } else if (info.daysUntilExpiry < 0) {
      severity = "critical";
      title = "SSL certificate has expired";
    } else if (info.daysUntilExpiry < 30) {
      severity = "warning";
      title = `SSL certificate expires in ${info.daysUntilExpiry} days`;
    } else {
      title = "Valid SSL certificate";
    }

    details.push(`Issuer: ${info.issuer}`);
    details.push(`Valid: ${info.validFrom.toLocaleDateString()} - ${info.validTo.toLocaleDateString()}`);
    details.push(`Protocol: ${info.protocol}`);
    if (info.daysUntilExpiry > 0) {
      details.push(`Expires in ${info.daysUntilExpiry} days`);
    }

    return {
      id: uuidv4(),
      type: "ssl",
      severity,
      title,
      detail: details.join(" | "),
      source: "SSL Certificate Analysis",
      confidence: 0.95,
      connections: [],
      metadata: {
        hostname,
        issuer: info.issuer,
        validFrom: info.validFrom.toISOString(),
        validTo: info.validTo.toISOString(),
        selfSigned: info.selfSigned,
        protocol: info.protocol,
      },
    };
  } catch (error) {
    const isNoSSL = error instanceof Error && error.message.includes("ECONNREFUSED");

    if (isNoSSL) {
      return {
        id: uuidv4(),
        type: "ssl",
        severity: "critical",
        title: "No SSL certificate found",
        detail: `${hostname} does not support HTTPS — data sent to this site is not encrypted`,
        source: "SSL Certificate Analysis",
        confidence: 0.95,
        connections: [],
        metadata: { hostname, error: true },
      };
    }

    const classification = classifyToolError(error);
    return {
      id: uuidv4(),
      type: "ssl",
      severity: classification.severity,
      title: "SSL check failed",
      detail: `Could not analyze SSL: ${error instanceof Error ? error.message : "Unknown error"}`,
      source: "SSL Certificate Analysis",
      confidence: 0.3,
      connections: [],
      metadata: { hostname, error: true, suspicious: classification.suspicious },
    };
  }
}
