"use client";

import { useEffect, useState, type ReactElement } from "react";

interface OLData {
  employeeName: string;
  position: string;
  date: string;
  startDate: string;
  workType: string;
  workingHours: string;
  baseSalary: number;
  hasCommission: boolean;
  commissionDesc: string;
  responsibilities: string[];
  hrManager: string;
  includeNDA: boolean;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatDate(dateStr: string): ReactElement {
  if (!dateStr) return <></>;
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  const suf = ordinal(day);
  return (
    <>
      {month} {day}
      <sup>{suf}</sup> - {year}
    </>
  );
}

function formatDatePlain(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  return `${month} ${day}${ordinal(day)} - ${year}`;
}

const teal = "#1a6b5a";

const sectionHeadingStyle: React.CSSProperties = {
  color: teal,
  fontWeight: "bold",
  fontSize: 15,
  marginBottom: 8,
  marginTop: 18,
};

const bulletListStyle: React.CSSProperties = {
  paddingLeft: 24,
  margin: "6px 0",
};

const pageStyle: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  background: "#fff",
  border: "1px solid black",
  padding: "20mm 18mm",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 13,
  color: "#000",
  position: "relative",
  overflow: "hidden",
  boxSizing: "border-box",
  margin: "0 auto",
};

const watermarkStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%) rotate(-30deg)",
  fontSize: 80,
  fontWeight: "bold",
  color: "rgba(0,0,0,0.08)",
  pointerEvents: "none",
  userSelect: "none",
  zIndex: 0,
  whiteSpace: "nowrap",
  letterSpacing: 8,
};

const contentStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: 9,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: 1,
  marginTop: 24,
  fontFamily: "Georgia, 'Times New Roman', serif",
};

function Watermark() {
  return <div style={watermarkStyle}>SUVORA TECH</div>;
}

function Footer() {
  return (
    <div style={footerStyle}>
      This is computer generated file doesn&apos;t need signature
    </div>
  );
}

export default function PrintOfferLetterPage() {
  const [data, setData] = useState<OLData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ol_data");
      if (raw) {
        setData(JSON.parse(raw) as OLData);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !data) return;
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, [ready, data]);

  if (!ready) return null;

  if (!data) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        No offer letter data found. Please go back and fill the form.
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { position: fixed; top: 0; left: 0; width: 100%; }
          .page-break { page-break-before: always; }
        }
        body { margin: 0; padding: 20px; background: #f5f5f5; }
        @media screen {
          #print-root { display: flex; flex-direction: column; gap: 20px; }
        }
      `}</style>

      <div id="print-root">
        {/* OFFER LETTER PAGE */}
        <div style={pageStyle}>
          <Watermark />
          <div style={contentStyle}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: "bold", fontSize: 20, letterSpacing: 2 }}>SUVORA TECH</div>
              <div style={{ fontWeight: "bold", fontSize: 16, marginTop: 4 }}>Offer Letter</div>
            </div>

            <p style={{ marginBottom: 12 }}>
              <strong>Date:</strong> {formatDate(data.date)}
            </p>

            <p style={{ marginBottom: 16 }}>Dear <strong>{data.employeeName}</strong>,</p>

            <p style={{ marginBottom: 4 }}>
              We are pleased to offer you the position of <strong>{data.position}</strong> at{" "}
              <strong>Suvora Tech</strong> as a remote employee.
            </p>

            {/* Section 1 */}
            <div style={sectionHeadingStyle}>1. Employment Details</div>
            <ul style={bulletListStyle}>
              <li><strong>Position:</strong> {data.position}</li>
              <li><strong>Start Date:</strong> {formatDatePlain(data.startDate)}</li>
              <li><strong>Work Type:</strong> {data.workType}</li>
              <li><strong>Working Hours:</strong> {data.workingHours}</li>
            </ul>

            {/* Section 2 */}
            <div style={sectionHeadingStyle}>2. Compensation</div>
            <ul style={bulletListStyle}>
              <li><strong>Base Salary:</strong> {data.baseSalary.toLocaleString()} PKR per month</li>
              {data.hasCommission && (
                <li><strong>Commission:</strong> {data.commissionDesc}</li>
              )}
            </ul>
            {data.hasCommission && (
              <div style={{ marginTop: 8, fontSize: 12.5 }}>
                <strong>Payment Condition:</strong> The base salary will be payable only if the employee
                successfully closes at least <strong>one (1)</strong> project deal within the month.
                If no deal is closed, the company reserves the right to: Withhold the base salary for
                that month. Commission will only be paid on successfully converted and paid projects.
                This structure is designed to ensure performance-based growth and mutual benefit.
              </div>
            )}

            {/* Section 3 */}
            <div style={sectionHeadingStyle}>3. Responsibilities</div>
            <p style={{ marginBottom: 6 }}>Your key responsibilities will include:</p>
            <ul style={bulletListStyle}>
              {data.responsibilities.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            {/* Section 4 */}
            <div style={sectionHeadingStyle}>4. Confidentiality</div>
            <p>
              You are required to maintain strict confidentiality regarding company data, client
              information, and project details.
            </p>

            {/* Section 5 */}
            <div style={sectionHeadingStyle}>5. Termination</div>
            <p>Either party may terminate this agreement with 30 days&apos; notice.</p>

            {/* Section 6 */}
            <div style={sectionHeadingStyle}>6. Agreement</div>
            <p>
              This offer is subject to signing the Non-Disclosure Agreement (NDA) and other company
              policies.
            </p>

            {/* Signature */}
            <div style={{ marginTop: 30 }}>
              <p>Sincerely,</p>
              <p style={{ marginTop: 12 }}>
                <strong>{data.hrManager}</strong>
                <br />
                HR Manager, Suvora Tech
              </p>
            </div>

            <Footer />
          </div>
        </div>

        {/* NDA PAGE */}
        {data.includeNDA && (
          <div style={{ ...pageStyle }} className="page-break">
            <Watermark />
            <div style={contentStyle}>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontWeight: "bold", fontSize: 18, letterSpacing: 1 }}>
                  NON-DISCLOSURE AGREEMENT (NDA)
                </div>
              </div>

              <p style={{ marginBottom: 16 }}>
                This Agreement is made on {formatDate(data.date)}, between:{" "}
                <strong>Suvora Tech</strong> (the &quot;Company&quot;) and{" "}
                <strong>{data.employeeName}</strong> (the &quot;Employee&quot;).
              </p>

              <div style={sectionHeadingStyle}>1. Purpose</div>
              <p>
                The Employee will have access to confidential and proprietary information related to
                company operations and client projects.
              </p>

              <div style={sectionHeadingStyle}>2. Confidential Information</div>
              <ul style={bulletListStyle}>
                <li>Source code</li>
                <li>Client data</li>
                <li>Business strategies</li>
                <li>Project details</li>
                <li>Credentials and systems access</li>
              </ul>

              <div style={sectionHeadingStyle}>3. Obligations</div>
              <ul style={bulletListStyle}>
                <li>Not disclose any confidential information to third parties</li>
                <li>Not use company data for personal or external benefit</li>
                <li>Protect all sensitive information during and after employment</li>
              </ul>

              <div style={sectionHeadingStyle}>4. Duration</div>
              <p>
                This agreement remains valid during employment and for 2 years after leaving the
                company.
              </p>

              <div style={sectionHeadingStyle}>5. Return of Data</div>
              <p>
                Upon termination, the Employee must return or delete all company-related data, files,
                and access credentials.
              </p>

              <div style={sectionHeadingStyle}>6. Breach</div>
              <p>Any breach of this agreement may result in legal action.</p>

              <div style={sectionHeadingStyle}>7. Governing Law</div>
              <p>This agreement shall be governed under the laws of Pakistan.</p>

              {/* Signatures */}
              <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                <div>
                  <p style={{ fontWeight: "bold", marginBottom: 10 }}>Company Representative:</p>
                  <p>Name: <strong>{data.hrManager}</strong></p>
                  <p style={{ marginTop: 20 }}>Signature: ___________________</p>
                  <p style={{ marginTop: 10 }}>Date: ___________________</p>
                </div>
                <div>
                  <p style={{ fontWeight: "bold", marginBottom: 10 }}>Employee:</p>
                  <p>Name: <strong>{data.employeeName}</strong></p>
                  <p style={{ marginTop: 20 }}>Signature: ___________________</p>
                  <p style={{ marginTop: 10 }}>Date: ___________________</p>
                </div>
              </div>

              <Footer />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
