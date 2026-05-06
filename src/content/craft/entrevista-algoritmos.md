---
title: "Algoritmos para Entrevistas — Padrões Práticos em TypeScript"
category: craft
stack: [TypeScript, Node.js]
tags: [algoritmos, entrevista, leetcode, typescript, data-structures, patterns]
excerpt: "Os 6 padrões que cobrem 90% das perguntas de live coding em vagas sênior de backend. Não é LeetCode Hard — é o que realmente aparece."
related: [typescript-avancado, tdd-red-green-refactor, jest-unit-nestjs]
updated: "2026-05"
---

## Contexto: o que aparece em vagas sênior backend

Vagas FAANG: LeetCode Hard, grafos complexos, DP avançado.  
Vagas sênior NestJS/Node.js no mercado geral (Brasil + remote): **Medium e alguns Hard** focados em lógica, manipulação de arrays e design de estruturas. Não memorize — entenda os padrões.

---

## Padrão 1: Two Pointers

**Quando usar:** array ordenado, par de elementos, remover duplicatas.

```ts
// Exemplo: encontrar par com soma-alvo em array ordenado
function twoSum(nums: number[], target: number): [number, number] | null {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null;
}
// O(n) tempo, O(1) espaço

// Variação: remover duplicatas de array ordenado in-place
function removeDuplicates(nums: number[]): number {
  if (nums.length === 0) return 0;
  let slow = 0;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;
}
```

---

## Padrão 2: Sliding Window

**Quando usar:** substring/subarray contíguo com tamanho fixo ou variável.

```ts
// Janela variável: maior substring sem repetição
function lengthOfLongestSubstring(s: string): number {
  const seen = new Map<string, number>(); // char → último índice visto
  let maxLen = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (seen.has(char) && seen.get(char)! >= left) {
      left = seen.get(char)! + 1; // move janela pra depois da repetição
    }
    seen.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
// O(n) tempo, O(min(n, alphabet)) espaço

// Janela fixa: máximo em janela de tamanho k
function maxSlidingWindow(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque: number[] = []; // índices em ordem decrescente de valor

  for (let i = 0; i < nums.length; i++) {
    while (deque.length && deque[0] < i - k + 1) deque.shift(); // fora da janela
    while (deque.length && nums[deque[deque.length - 1]] < nums[i]) deque.pop();
    deque.push(i);
    if (i >= k - 1) result.push(nums[deque[0]]);
  }
  return result;
}
```

---

## Padrão 3: Hash Map — contagem e agrupamento

**Quando usar:** frequência, existência rápida, agrupar por chave.

```ts
// Anagramas
function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const count = new Map<string, number>();
  for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
  for (const c of t) {
    if (!count.has(c)) return false;
    count.set(c, count.get(c)! - 1);
    if (count.get(c)! < 0) return false;
  }
  return true;
}

// Agrupar anagramas — aparece muito em entrevista
function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>();
  for (const str of strs) {
    const key = str.split("").sort().join("");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(str);
  }
  return [...map.values()];
}

// Subarray com soma k — clássico de entrevista sênior
function subarraySum(nums: number[], k: number): number {
  const prefixCount = new Map<number, number>([[0, 1]]);
  let count = 0;
  let prefix = 0;
  for (const n of nums) {
    prefix += n;
    count += prefixCount.get(prefix - k) ?? 0;
    prefixCount.set(prefix, (prefixCount.get(prefix) ?? 0) + 1);
  }
  return count;
}
```

---

## Padrão 4: BFS / DFS em Árvore e Grafo

**Quando usar:** menor caminho (BFS), exploração completa (DFS), componentes conectados.

```ts
// BFS — nível por nível (menor caminho em grafo não-ponderado)
function bfs(graph: Map<number, number[]>, start: number): number[] {
  const visited = new Set([start]);
  const queue = [start];
  const order: number[] = [];

  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return order;
}

// DFS iterativo em árvore binária — nível por nível
interface TreeNode { val: number; left?: TreeNode; right?: TreeNode; }

function levelOrder(root: TreeNode | undefined): number[][] {
  if (!root) return [];
  const result: number[][] = [];
  const queue: TreeNode[] = [root];

  while (queue.length) {
    const levelSize = queue.length;
    const level: number[] = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}

// Componentes conectados — muito comum em entrevistas de sistema
function countComponents(n: number, edges: [number, number][]): number {
  const graph = new Map<number, number[]>();
  for (let i = 0; i < n; i++) graph.set(i, []);
  for (const [a, b] of edges) {
    graph.get(a)!.push(b);
    graph.get(b)!.push(a);
  }
  const visited = new Set<number>();
  let components = 0;

  function dfs(node: number) {
    visited.add(node);
    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) dfs(neighbor);
    }
  }

  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) { dfs(i); components++; }
  }
  return components;
}
```

---

## Padrão 5: Dynamic Programming — os 3 que bastam

**Quando usar:** subproblemas sobrepostos, decisão a cada passo.

```ts
// 1. Subarray de soma máxima (Kadane)
function maxSubArray(nums: number[]): number {
  let maxSum = nums[0];
  let current = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    maxSum = Math.max(maxSum, current);
  }
  return maxSum;
}

// 2. Longest Common Subsequence — aparece em diff/merge tools
function lcs(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// 3. Knapsack — rate limiting, agendamento de jobs
function knapsack(weights: number[], values: number[], capacity: number): number {
  const dp = new Array<number>(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let c = capacity; c >= weights[i]; c--) {
      dp[c] = Math.max(dp[c], dp[c - weights[i]] + values[i]);
    }
  }
  return dp[capacity];
}
```

---

## Padrão 6: Design de estrutura de dados — o que diferencia sênior

```ts
// LRU Cache — aparece em quase toda entrevista sênior
class LRUCache {
  private capacity: number;
  private map = new Map<number, number>(); // mantém ordem de inserção

  constructor(capacity: number) { this.capacity = capacity; }

  get(key: number): number {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val); // move para o fim (mais recente)
    return val;
  }

  put(key: number, value: number): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      this.map.delete(this.map.keys().next().value!); // remove o mais antigo
    }
    this.map.set(key, value);
  }
}

// Rate Limiter com sliding window (aparece em system design)
class RateLimiter {
  private requests = new Map<string, number[]>(); // userId → timestamps

  constructor(private limit: number, private windowMs: number) {}

  isAllowed(userId: string): boolean {
    const now = Date.now();
    const window = now - this.windowMs;
    const timestamps = (this.requests.get(userId) ?? []).filter(t => t > window);
    if (timestamps.length >= this.limit) return false;
    timestamps.push(now);
    this.requests.set(userId, timestamps);
    return true;
  }
}
```

---

## Complexidade — o que você precisa saber dizer

```
O(1)    → hash map lookup, array index
O(log n) → binary search, heap operations
O(n)    → single loop, hash map build
O(n log n) → sort, merge sort
O(n²)   → nested loops sem otimização
O(2ⁿ)   → backtracking sem memoização (nunca deixe assim)
```

Em toda solução que apresentar: diga a complexidade de **tempo E espaço** antes que perguntem.

---

## Estratégia de entrevista de 45 minutos

```
0-5min   → Clarify: pergunte edge cases, constraints, exemplos
5-10min  → Brute force: descreva em voz alta, NÃO codifique ainda
10-15min → Optimize: identifique o padrão, explique a melhoria
15-35min → Código: TypeScript limpo, nomes descritivos, passo a passo
35-40min → Testes: rode os exemplos do problema na cabeça
40-45min → Edge cases: vazio, tamanho 1, negativos, overflow
```

**Nunca fique em silêncio.** Pensamento em voz alta vale tanto quanto a solução.

## Como pedir pra IA

> "Gere um problema de entrevista de nível sênior backend sobre [padrão]. Contexto: vaga NestJS, live coding de 45 minutos. Inclua: enunciado claro, 2 exemplos com input/output, a solução em TypeScript com complexidade explicada, e 2 variações comuns do problema que o entrevistador pode perguntar depois."

## Auditoria

- [ ] Sabes explicar a complexidade de tempo E espaço de cada solução.
- [ ] Praticaste falar em voz alta enquanto codifica (não só no silêncio).
- [ ] LRU Cache implementado sem olhar — aparece em 30% das entrevistas sênior.
- [ ] Two pointers e sliding window implementados em < 5 minutos.

## Anti-padrões

- Memorizar soluções sem entender o padrão — uma variação do problema quebraria.
- Só praticar com IDE com autocomplete — em entrevista o ambiente é simples.
- Pular para código sem clarificar o problema primeiro.
- Não mencionar complexidade — entrevistador sempre vai perguntar.
