import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";

const ExtractInput = z.object({
  contractText: z.string().min(1).max(80_000),
});

const RuleSchema = z.object({
  category: z.string(),
  baseType: z.enum(["brasindice", "simpro", "cbhpm", "contract", "none"]),
  codes: z.string(),
  factor: z.number(),
  adjustmentPercent: z.number(),
  negotiatedValue: z.number().nullable(),
  validFrom: z.string(),
  validTo: z.string(),
  sourceExcerpt: z.string(),
});

const RulesSchema = z.object({
  rules: z.array(RuleSchema),
});

export type ExtractedContractRule = z.infer<typeof RuleSchema>;

const SYSTEM_PROMPT = `Você extrai regras de remuneração de contratos de prestadores de saúde no Brasil.
Responda somente com as regras realmente escritas no contrato recebido.

Para cada regra identificada preencha:
- category: categoria de cobrança citada no contrato (ex.: medicamentos, materiais, procedimentos, diárias, taxas). Use "" quando a regra valer para todo o contrato.
- baseType: "brasindice", "simpro" ou "cbhpm" quando a regra manda usar essa tabela de referência; "contract" quando o contrato define um valor fixo negociado; "none" quando não houver referência clara.
- codes: códigos específicos citados na regra, separados por vírgula. Use "" quando a regra não citar códigos.
- factor: multiplicador aplicado ao valor de referência (1 quando não houver).
- adjustmentPercent: desconto como número negativo e acréscimo como número positivo, em porcentagem (0 quando não houver).
- negotiatedValue: valor fixo em reais quando baseType for "contract"; caso contrário null.
- validFrom / validTo: vigência da regra em yyyy-MM-dd quando o contrato informar; caso contrário "".
- sourceExcerpt: trecho curto e literal do contrato que originou a regra.

Um contrato pode usar bases diferentes para categorias diferentes. Não invente regras, códigos ou valores que não estejam no texto. Se nenhuma regra for identificável, devolva uma lista vazia.`;

/** Leitura automática das regras de remuneração descritas no contrato. */
export const extractContractRules = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("A leitura automática do contrato não está configurada.");

    const gateway = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const result = streamText({
      model: gateway.responses("openai/gpt-6-astra"),
      system: SYSTEM_PROMPT,
      prompt: `Texto do contrato:\n\n${data.contractText}`,
      output: Output.object({ schema: RulesSchema }),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "medium",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const output = await result.output;
    return output.rules;
  });
