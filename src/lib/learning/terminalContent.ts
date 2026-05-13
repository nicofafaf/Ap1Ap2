import type { LearningField } from "../../data/nexusRegistry";
import { createSeededRandom } from "../combat/anomalyProcessor";
import {
  getLearningExerciseById,
  pickFinalExamExercise,
  pickLearningExercise,
  pickLearningExerciseFromLfAdaptive,
  type LearningExercise,
  type LeitnerCardState,
} from "./learningRegistry";

export type TerminalSnippet = {
  lang: "sql" | "csharp" | "bash" | "javascript" | "plain-text" | "markdown";
  code: string;
  caption: string;
};

export type TerminalLearningBundle = {
  snippet: TerminalSnippet;
  exercise: LearningExercise | null;
  /** Tatsächliches Curriculum-LF der Aufgabe (Final Exam / Morph) */
  exerciseLf?: LearningField;
};

const SNIPPETS: Record<
  LearningField,
  Record<"HardwareNetworking" | "SecurityCryptography" | "DatabaseLogic", TerminalSnippet>
> = {
  LF1: {
    HardwareNetworking: {
      lang: "csharp",
      code: `// Binäre Adressierung — Subnetz-Rechner\nuint hostCount = (uint)(Math.Pow(2, 32 - cidr) - 2);\nConsole.WriteLine($"Nutzbar: {hostCount}");`,
      caption: "C# — Hostanzahl aus CIDR",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `using System.Security.Cryptography;\nusing var aes = Aes.Create();\naes.KeySize = 256;\naes.GenerateIV();`,
      caption: "C# — AES-256 Initialisierung",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT n.name, n.subnet_mask\nFROM network_node n\nWHERE n.active = 1\nORDER BY n.priority DESC\nLIMIT 16;`,
      caption: "SQL — aktive Netzknoten",
    },
  },
  LF2: {
    HardwareNetworking: {
      lang: "csharp",
      code: `public sealed class ProcessGate\n{\n    private int _quantum = 4;\n    public void Reschedule() => _quantum = Math.Clamp(_quantum * 2, 1, 64);\n}`,
      caption: "C# — Scheduling-Quantum",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `if (privilegeLevel < RequiredClearance)\n{\n    AuditLog.Write("DENY", userId);\n    return AuthResult.ElevateRequired;\n}`,
      caption: "C# — Zugriffskontrolle",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT job_id, AVG(cpu_ms) AS avg_cpu\nFROM process_metrics\nWHERE sampled_at > NOW() - INTERVAL '1' HOUR\nGROUP BY job_id\nHAVING AVG(cpu_ms) > 120;`,
      caption: "SQL — CPU-Hotspots",
    },
  },
  LF3: {
    HardwareNetworking: {
      lang: "csharp",
      code: `bool IsPowerOfTwo(int x) => x > 0 && (x & (x - 1)) == 0;\n// Gates für Bus-Adressierung`,
      caption: "C# — Zweierpotenz-Check",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `var hash = SHA256.HashData(Encoding.UTF8.GetBytes(secret));\nreturn Convert.ToHexString(hash);`,
      caption: "C# — SHA-256 Digest",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `WITH RECURSIVE walk(id, depth) AS (\n  SELECT id, 0 FROM graph WHERE parent_id IS NULL\n  UNION ALL\n  SELECT g.id, w.depth + 1\n  FROM graph g JOIN walk w ON g.parent_id = w.id\n)\nSELECT * FROM walk WHERE depth <= 12;`,
      caption: "SQL — rekursiver Graph",
    },
  },
  LF4: {
    HardwareNetworking: {
      lang: "csharp",
      code: `ReadOnlySpan<byte> frame = stackalloc byte[14];\nEthHeader.Parse(frame, out var dst, out var src);`,
      caption: "C# — Ethernet-Frame",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `var cert = new X509Certificate2("nexus.pfx", flags: X509KeyStorageFlags.EphemeralKeySet);\nreturn cert.GetRSAPublicKey();`,
      caption: "C# — Zertifikat laden",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT packet_id, LENGTH(payload) AS bytes\nFROM capture_row\nWHERE protocol = 'TCP'\n  AND dst_port IN (443, 8443);`,
      caption: "SQL — TLS-relevante Flows",
    },
  },
  LF5: {
    HardwareNetworking: {
      lang: "csharp",
      code: `await socket.ConnectAsync(host, 443);\nusing var tls = new SslStream(stream);\nawait tls.AuthenticateAsClientAsync(host);`,
      caption: "C# — TLS-Handshake",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 310000, HashAlgorithmName.SHA256);\nreturn pbkdf2.GetBytes(32);`,
      caption: "C# — PBKDF2 Schlüssel",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT session_id, cipher_suite\nFROM tls_session\nWHERE handshake_ms > 180\nORDER BY handshake_ms DESC;`,
      caption: "SQL — langsame Handshakes",
    },
  },
  LF6: {
    HardwareNetworking: {
      lang: "csharp",
      code: `var route = RoutingTable.Match(packet.Destination);\nInterface.Send(route.Egress, packet);`,
      caption: "C# — Routing-Entscheid",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `if (!IPAddress.TryParse(untrusted, out var ip))\n    throw new FormatException("Invalid IP");`,
      caption: "C# — IP härten",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT r.prefix, r.nexthop, r.metric\nFROM route r\nWHERE r.family = 'inet6'\nORDER BY r.metric ASC;`,
      caption: "SQL — IPv6-Routen",
    },
  },
  LF7: {
    HardwareNetworking: {
      lang: "csharp",
      code: `Dns.GetHostAddresses("nexus.local");\n// Resolver-Cache invalidieren bei TTL-Überlauf`,
      caption: "C# — DNS Lookup",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `var hmac = new HMACSHA256(key);\nvar tag = hmac.ComputeHash(message);\nreturn CryptographicOperations.FixedTimeEquals(tag, expected);`,
      caption: "C# — HMAC verify",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT fqdn, ttl_sec, record_type\nFROM dns_zone\nWHERE signed = 0 AND record_type = 'A';`,
      caption: "SQL — unsigned A-Records",
    },
  },
  LF8: {
    HardwareNetworking: {
      lang: "csharp",
      code: `using var tcp = new TcpClient();\ntcp.NoDelay = true;\nawait tcp.ConnectAsync(endpoint);`,
      caption: "C# — TCP NoDelay",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `RandomNumberGenerator.Fill(nonce);\nChaCha20Poly1305.Encrypt(key, nonce, plaintext, ciphertext, tag);`,
      caption: "C# — AEAD Nonce",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT src_ip, dst_ip, retrans_count\nFROM tcp_flow\nWHERE retrans_count > 6\n  AND window_scale IS NOT NULL;`,
      caption: "SQL — Retransmissions",
    },
  },
  LF9: {
    HardwareNetworking: {
      lang: "csharp",
      code: `var builder = new UriBuilder("https", host, 443, path);\nreturn builder.Uri;`,
      caption: "C# — URI Builder",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `var claims = new List<Claim> { new("sub", userId), new("scope", "api.read") };\nvar jwt = handler.CreateToken(descriptor);`,
      caption: "C# — JWT Claims",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT request_id, status, latency_ms\nFROM http_access\nWHERE path LIKE '/api/%'\nORDER BY latency_ms DESC\nLIMIT 50;`,
      caption: "SQL — API-Latenzen",
    },
  },
  LF10: {
    HardwareNetworking: {
      lang: "csharp",
      code: `socket.Bind(new IPEndPoint(IPAddress.Any, port));\nsocket.Listen(backlog: 128);`,
      caption: "C# — Listen-Socket",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `options.AddPolicy("Api", p =>\n{\n    p.RequireAuthenticatedUser();\n    p.RequireClaim("scope", "api.write");\n});`,
      caption: "C# — Policy",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT listener_port, active_threads, queue_depth\nFROM server_pool\nWHERE draining = 0;`,
      caption: "SQL — Pool-Last",
    },
  },
  LF11: {
    HardwareNetworking: {
      lang: "csharp",
      code: `await using var resp = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);\nresp.EnsureSuccessStatusCode();`,
      caption: "C# — Streaming-Response",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `var ocsp = await client.GetByteArrayAsync(ocspUri);\nif (!OcspVerifier.IsGood(ocsp, cert))\n    throw new SecurityException("Revoked");`,
      caption: "C# — OCSP-Stapling",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT cache_key, hit_ratio, stale_sec\nFROM cdn_edge\nWHERE hit_ratio < 0.72;`,
      caption: "SQL — Cache-Treffer",
    },
  },
  LF12: {
    HardwareNetworking: {
      lang: "csharp",
      code: `Parallel.ForEach(chunks, new ParallelOptions { MaxDegreeOfParallelism = 8 }, ProcessChunk);`,
      caption: "C# — Parallel.ForEach",
    },
    SecurityCryptography: {
      lang: "csharp",
      code: `using var lease = MemoryPool<byte>.Shared.Rent(size);\nCryptographicOperations.ZeroMemory(lease.Memory.Span);`,
      caption: "C# — sensibler Puffer",
    },
    DatabaseLogic: {
      lang: "sql",
      code: `SELECT shard_id, row_count, bytes_on_disk\nFROM warehouse_shard\nORDER BY bytes_on_disk DESC;`,
      caption: "SQL — Shard-Größe",
    },
  },
};

export function getTerminalSnippet(
  lf: LearningField,
  semantic: keyof (typeof SNIPPETS)["LF1"]
): TerminalSnippet {
  return SNIPPETS[lf][semantic];
}

/** Prüfungsaufgaben LF5 (SQL), LF6 (JS), LF7 (C#) — sonst klassisches Snippet */
export { getMentorDeepDive } from "./mentorDeepDives";

export function getTerminalLearningBundle(
  lf: LearningField,
  semantic: keyof (typeof SNIPPETS)["LF1"],
  seed: number,
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  preferredExerciseId?: string | null
): TerminalLearningBundle {
  if (preferredExerciseId) {
    const preferred = getLearningExerciseById(lf, preferredExerciseId);
    if (preferred) {
      return {
        snippet: {
          lang: preferred.lang,
          code: preferred.solutionCode,
          caption: preferred.title,
        },
        exercise: preferred,
        exerciseLf: lf,
      };
    }
  }
  const now = Date.now();
  const exercise = leitner
    ? pickLearningExerciseFromLfAdaptive(lf, createSeededRandom(seed >>> 0), leitner, now)
    : pickLearningExercise(lf, semantic, seed);
  if (exercise) {
    return {
      snippet: {
        lang: exercise.lang,
        code: exercise.solutionCode,
        caption: exercise.title,
      },
      exercise,
      exerciseLf: lf,
    };
  }
  return {
    snippet: getTerminalSnippet(lf, semantic),
    exercise: null,
    exerciseLf: lf,
  };
}

/** Sektor 0 Final Exam: eine zufällige Übung aus einem zufälligen LF (1…12), adaptiv gewichtet */
export function getFinalExamLearningBundle(
  seed: number,
  leitner: Readonly<Record<string, LeitnerCardState>>
): TerminalLearningBundle {
  const rng = createSeededRandom(seed >>> 0);
  const picked = pickFinalExamExercise(rng, leitner, Date.now());
  if (!picked) {
    return {
      snippet: { lang: "plain-text", code: "// empty", caption: "Final Exam" },
      exercise: null,
    };
  }
  const { exercise, lf } = picked;
  return {
    snippet: {
      lang: exercise.lang,
      code: exercise.solutionCode,
      caption: exercise.title,
    },
    exercise,
    exerciseLf: lf,
  };
}
