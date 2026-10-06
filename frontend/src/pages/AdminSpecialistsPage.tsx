import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "../api/client";
import { PageState } from "../components/PageState";
import {
  approveSpecialist,
  listSpecialists,
  rejectSpecialist,
  suspendSpecialist,
  type ReviewStatus,
} from "../features/admin/admin.api";
const labels: Record<ReviewStatus, string> = {
  PENDING: "Pendientes",
  APPROVED: "Aprobados",
  REJECTED: "Rechazados",
  SUSPENDED: "Suspendidos",
};
export function AdminSpecialistsPage() {
  const [status, setStatus] = useState<ReviewStatus>("PENDING");
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "specialists", status],
    queryFn: () => listSpecialists(status),
  });
  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["admin", "specialists"] });
  const approve = useMutation({
    mutationFn: approveSpecialist,
    onSuccess: refresh,
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectSpecialist(id, reason),
    onSuccess: refresh,
  });
  const suspend = useMutation({
    mutationFn: suspendSpecialist,
    onSuccess: refresh,
  });
  const actionError = approve.error || reject.error || suspend.error;
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Especialistas</h1>
          <p>Revisa y administra el acceso profesional a la plataforma.</p>
        </div>
      </header>
      <section className="panel">
        <div className="status-tabs">
          {(Object.keys(labels) as ReviewStatus[]).map((x) => (
            <button
              key={x}
              className={`button ${status === x ? "button--primary" : "button--ghost"}`}
              onClick={() => setStatus(x)}
            >
              {labels[x]}
            </button>
          ))}
        </div>
        {actionError && (
          <p className="form-error">
            {actionError instanceof ApiError
              ? actionError.message
              : "No fue posible completar la acción."}
          </p>
        )}
        {query.isPending && <PageState title="Consultando solicitudes…" />}
        {query.isError && <PageState title="No pudimos cargar especialistas" />}
        {query.data?.data.length === 0 && (
          <PageState
            title={`No hay especialistas ${labels[status].toLowerCase()}.`}
          />
        )}{" "}
        {query.data && query.data.data.length > 0 && (
          <div className="table-wrap">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Especialista</th>
                  <th>Especialidad</th>
                  <th>Cédula</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      <small>
                        {s.email}
                        <br />
                        {s.phone}
                      </small>
                    </td>
                    <td>{s.profile?.specialty ?? "Sin especialidad"}</td>
                    <td>
                      {s.profile?.professionalLicense ?? "Sin cédula"}
                      {s.profile?.specialtyLicense && (
                        <small>
                          <br />
                          Esp. {s.profile.specialtyLicense}
                        </small>
                      )}
                    </td>
                    <td>{new Date(s.createdAt).toLocaleDateString("es-MX")}</td>
                    <td>
                      <div className="table-actions">
                        {status !== "APPROVED" && (
                          <button
                            className="button button--primary"
                            disabled={approve.isPending}
                            onClick={() => approve.mutate(s.id)}
                          >
                            Aprobar
                          </button>
                        )}
                        {status === "PENDING" && (
                          <button
                            className="button button--ghost"
                            disabled={reject.isPending}
                            onClick={() => {
                              const reason = window.prompt(
                                "Motivo del rechazo:",
                              );
                              if (reason?.trim())
                                reject.mutate({ id: s.id, reason });
                            }}
                          >
                            Rechazar
                          </button>
                        )}
                        {status === "APPROVED" && (
                          <button
                            className="button button--ghost"
                            disabled={suspend.isPending}
                            onClick={() =>
                              window.confirm(`¿Suspender a ${s.name}?`) &&
                              suspend.mutate(s.id)
                            }
                          >
                            Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
