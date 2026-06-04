"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { Search, CheckCircle2, XCircle, Clock, LogOut, Loader2, User } from "lucide-react";
import { cn, getInitials, formatDate } from "@/lib/utils";
import {
  searchMembersAction,
  checkAccessAction,
  registerExitAction,
  type MemberSearchResult,
  type AccessResult,
} from "./actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type UIState =
  | { screen: "search" }
  | { screen: "loading"; memberName: string }
  | { screen: "result"; result: AccessResult; memberId: string };

// ── Avatar ────────────────────────────────────────────────────────────────────

function MemberAvatar({
  name,
  photoUrl,
  size = "lg",
}: {
  name: string;
  photoUrl: string | null;
  size?: "sm" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "w-12 h-12 text-base",
    lg: "w-24 h-24 text-3xl",
    xl: "w-32 h-32 text-4xl",
  };

  const initials = getInitials(name);

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover border-4 border-white/30 shadow-xl",
          sizeClasses[size]
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-white/20 border-4 border-white/30 shadow-xl",
        "flex items-center justify-center font-bold text-white",
        sizeClasses[size]
      )}
    >
      {initials || <User className="w-1/2 h-1/2 opacity-70" />}
    </div>
  );
}

// ── MemberCard ────────────────────────────────────────────────────────────────

function MemberCard({
  member,
  onSelect,
  isLoading,
}: {
  member: MemberSearchResult;
  onSelect: (m: MemberSearchResult) => void;
  isLoading: boolean;
}) {
  const initials = getInitials(`${member.first_name} ${member.last_name}`);
  const statusColor =
    member.status === "ACTIVO"
      ? "bg-emerald-100 text-emerald-700"
      : member.status === "SUSPENDIDO"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-500";

  return (
    <button
      onClick={() => onSelect(member)}
      disabled={isLoading}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl",
        "bg-white border border-gray-200 shadow-sm",
        "hover:border-blue-400 hover:shadow-md hover:bg-blue-50/40",
        "active:scale-[0.98] transition-all text-left",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      )}
    >
      {/* Avatar */}
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white text-lg font-bold shrink-0 shadow">
        {member.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.photo_url}
            alt=""
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          initials || <User className="w-6 h-6 opacity-70" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-lg font-semibold text-gray-900 truncate">
          {member.first_name} {member.last_name}
        </p>
        {member.dni && (
          <p className="text-sm text-gray-500 mt-0.5">DNI {member.dni}</p>
        )}
      </div>

      {/* Status badge */}
      <span
        className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold shrink-0",
          statusColor
        )}
      >
        {member.status}
      </span>
    </button>
  );
}

// ── ResultScreen ──────────────────────────────────────────────────────────────

function ResultScreen({
  result,
  memberId,
  onBack,
  onRegisterExit,
}: {
  result: AccessResult;
  memberId: string;
  onBack: () => void;
  onRegisterExit: (memberId: string) => void;
}) {
  const [countdown, setCountdown] = useState(4);
  const [exitDone, setExitDone] = useState(false);
  const [exitLoading, setExitLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(intervalRef.current!);
          onBack();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [onBack]);

  async function handleExit() {
    if (exitLoading || exitDone) return;
    clearInterval(intervalRef.current!);
    setExitLoading(true);
    await onRegisterExit(memberId);
    setExitLoading(false);
    setExitDone(true);
    setTimeout(onBack, 2000);
  }

  const isGranted = result.granted;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "transition-colors duration-300",
        isGranted
          ? "bg-gradient-to-br from-emerald-500 to-green-600"
          : "bg-gradient-to-br from-red-500 to-rose-700"
      )}
    >
      {/* Countdown ring */}
      <div className="absolute top-6 right-6">
        <div
          className={cn(
            "w-14 h-14 rounded-full border-4 flex items-center justify-center",
            "text-white font-bold text-xl",
            isGranted ? "border-white/40" : "border-white/40"
          )}
        >
          {exitDone ? (
            <CheckCircle2 className="w-6 h-6 text-white" />
          ) : (
            countdown
          )}
        </div>
      </div>

      {/* Main icon */}
      <div
        className={cn(
          "mb-8 flex items-center justify-center rounded-full",
          "w-32 h-32 shadow-2xl",
          isGranted
            ? "bg-white/20 text-white"
            : "bg-white/20 text-white"
        )}
      >
        {isGranted ? (
          <CheckCircle2 className="w-20 h-20 drop-shadow-lg" strokeWidth={1.5} />
        ) : (
          <XCircle className="w-20 h-20 drop-shadow-lg" strokeWidth={1.5} />
        )}
      </div>

      {/* Status label */}
      <h1 className="text-4xl md:text-5xl font-black text-white text-center drop-shadow-md mb-2 tracking-tight">
        {isGranted ? "ACCESO PERMITIDO" : "ACCESO DENEGADO"}
      </h1>

      {/* Divider */}
      <div className="w-24 h-1 rounded-full bg-white/30 my-5" />

      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <MemberAvatar
          name={result.memberName}
          photoUrl={null}
          size="xl"
        />
        <p className="text-3xl font-bold text-white drop-shadow">
          {result.memberName}
        </p>
      </div>

      {/* Details */}
      {isGranted && result.granted && (
        <div className="flex flex-col items-center gap-1 mb-8">
          <p className="text-xl text-white/90 font-semibold">{result.planName}</p>
          <p className="text-base text-white/70">
            Válido hasta{" "}
            <span className="font-semibold text-white">
              {formatDate(result.endDate)}
            </span>
          </p>
        </div>
      )}

      {!isGranted && !result.granted && (
        <div className="max-w-sm text-center mb-8 px-4">
          <p className="text-xl text-white/90 font-medium leading-snug">
            {result.reason}
          </p>
        </div>
      )}

      {/* Register exit button */}
      {isGranted && result.granted && (
        <button
          onClick={handleExit}
          disabled={exitLoading || exitDone}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold",
            "bg-white/20 border-2 border-white/40 text-white",
            "hover:bg-white/30 active:scale-95 transition-all",
            "disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          )}
        >
          {exitLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : exitDone ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          {exitDone ? "Salida registrada" : "Registrar salida"}
        </button>
      )}

      {/* Back button */}
      <button
        onClick={() => {
          clearInterval(intervalRef.current!);
          onBack();
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white text-sm font-medium underline underline-offset-4 transition-colors"
      >
        Volver a buscar
      </button>
    </div>
  );
}

// ── LoadingScreen ─────────────────────────────────────────────────────────────

function LoadingScreen({ memberName }: { memberName: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-white text-2xl font-bold">{memberName}</p>
          <p className="text-gray-400 mt-2 text-base">Verificando acceso…</p>
        </div>
      </div>
    </div>
  );
}

// ── Main AccessControl ────────────────────────────────────────────────────────

export function AccessControl() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [uiState, setUiState] = useState<UIState>({ screen: "search" });
  const [enterPending, setEnterPending] = useState(false);
  const [, startTransition] = useTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Select member → check access
  const handleSelectMember = useCallback(async (member: MemberSearchResult) => {
    const fullName = `${member.first_name} ${member.last_name}`;
    setUiState({ screen: "loading", memberName: fullName });

    const result = await checkAccessAction(member.id);
    setUiState({ screen: "result", result, memberId: member.id });
  }, []);

  const handleSelectMemberRef = useRef(handleSelectMember);
  handleSelectMemberRef.current = handleSelectMember;

  // Debounced search
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      startTransition(async () => {
        const found = await searchMembersAction(value.trim());
        setResults(found);
        setSearching(false);
        setEnterPending((pending) => {
          if (pending && found.length > 0) {
            handleSelectMemberRef.current(found[0]);
            return false;
          }
          return false;
        });
      });
    }, 300);
  }, []);

  // Return to search screen
  const handleBack = useCallback(() => {
    setQuery("");
    setResults([]);
    setUiState({ screen: "search" });
    // Re-focus input after a tick so any animation has settled
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Register exit
  const handleRegisterExit = useCallback(async (memberId: string) => {
    await registerExitAction(memberId);
  }, []);

  // Enter key → select first result, or mark pending if still searching
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      if (results.length > 0) {
        handleSelectMember(results[0]);
      } else if (searching) {
        setEnterPending(true);
      }
    },
    [results, searching, handleSelectMember]
  );

  // Clear search
  function handleClear() {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  }

  // ── Overlays ──

  if (uiState.screen === "loading") {
    return <LoadingScreen memberName={uiState.memberName} />;
  }

  if (uiState.screen === "result") {
    return (
      <ResultScreen
        result={uiState.result}
        memberId={uiState.memberId}
        onBack={handleBack}
        onRegisterExit={handleRegisterExit}
      />
    );
  }

  // ── Search screen ──

  return (
    <div className="flex flex-col items-center w-full min-h-[70vh] pt-8 pb-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg mb-4">
          <Search className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Control de Acceso</h2>
        <p className="text-gray-500 mt-1.5 text-base">Portería del gimnasio</p>
      </div>

      {/* Search box */}
      <div className="w-full max-w-2xl relative mb-6">
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border-2 bg-white shadow-sm px-5 py-4",
            "transition-all duration-200",
            query
              ? "border-blue-500 shadow-blue-100 shadow-md"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          {searching ? (
            <Loader2 className="w-6 h-6 text-blue-500 shrink-0 animate-spin" />
          ) : (
            <Search className="w-6 h-6 text-gray-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            autoFocus
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por nombre o DNI…"
            className={cn(
              "flex-1 text-xl font-medium bg-transparent outline-none",
              "placeholder:text-gray-300 text-gray-900"
            )}
          />
          {query && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="w-full max-w-2xl space-y-3">
        {/* Empty state while typing */}
        {!searching && query.trim().length >= 2 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
            <User className="w-12 h-12 opacity-40" />
            <p className="text-lg font-medium">Sin resultados para &ldquo;{query}&rdquo;</p>
            <p className="text-sm">Verificá el nombre o número de DNI</p>
          </div>
        )}

        {/* Hint state */}
        {query.trim().length < 2 && (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-300">
            <Clock className="w-12 h-12 opacity-40" />
            <p className="text-lg font-medium">Escribí al menos 2 caracteres</p>
          </div>
        )}

        {/* Member cards */}
        {results.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onSelect={handleSelectMember}
            isLoading={uiState.screen === "loading"}
          />
        ))}
      </div>
    </div>
  );
}
