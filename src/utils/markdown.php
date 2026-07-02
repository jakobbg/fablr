<?php
declare(strict_types=1);

/**
 * Minimal safe Markdown-to-HTML renderer.
 *
 * Supported syntax:
 *   # Heading 1..6 (ATX style)
 *   **bold**, *italic*, ***bold italic***
 *   `inline code`
 *   ```code block```
 *   [link text](url)   — http/https/mailto/relative only
 *   - / * unordered lists
 *   1. ordered lists
 *   > blockquotes
 *   --- / *** horizontal rules
 *   Blank lines separate paragraphs.
 *
 * All user text is HTML-escaped before inline transformations are applied.
 * Link URLs are validated to reject javascript: and other dangerous schemes.
 */
function render_markdown(string $source): string {
    $src = str_replace(["\r\n", "\r"], "\n", $source);

    // Split on fenced code blocks first so their contents are never processed.
    $segments = preg_split('/^```[^\n]*\n(.*?)^```[ \t]*$/ms', $src, -1, PREG_SPLIT_DELIM_CAPTURE);
    if ($segments === false) $segments = [$src];

    $html = '';
    foreach ($segments as $i => $seg) {
        if ($i % 2 === 1) {
            // Odd segments are captured code-block contents.
            $html .= '<pre><code>' . htmlspecialchars(rtrim($seg), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "</code></pre>\n";
        } else {
            $html .= markdown_blocks($seg);
        }
    }
    return $html;
}

function markdown_blocks(string $text): string {
    $lines = explode("\n", $text);
    $out   = '';
    $para  = [];
    $n     = count($lines);
    $i     = 0;

    $flushPara = static function () use (&$para, &$out): void {
        if (empty($para)) return;
        $out  .= '<p>' . markdown_inline(implode(' ', array_map('trim', $para))) . "</p>\n";
        $para  = [];
    };

    while ($i < $n) {
        $line    = $lines[$i];
        $trimmed = rtrim($line);

        // Heading: # to ######
        if (preg_match('/^(#{1,6})\s+(.+)$/', $trimmed, $m)) {
            $flushPara();
            $lv   = strlen($m[1]);
            $out .= "<h{$lv}>" . markdown_inline($m[2]) . "</h{$lv}>\n";
            $i++;
            continue;
        }

        // Horizontal rule: --- / *** / ___ (3+ chars, only that char)
        if (preg_match('/^(\*{3,}|-{3,}|_{3,})$/', $trimmed)) {
            $flushPara();
            $out .= "<hr>\n";
            $i++;
            continue;
        }

        // Blockquote: > lines
        if (str_starts_with($trimmed, '> ') || $trimmed === '>') {
            $flushPara();
            $qLines = [];
            while ($i < $n && (str_starts_with(rtrim($lines[$i]), '> ') || rtrim($lines[$i]) === '>')) {
                $qLines[] = preg_replace('/^>\s?/', '', rtrim($lines[$i]));
                $i++;
            }
            $out .= '<blockquote>' . markdown_blocks(implode("\n", $qLines)) . "</blockquote>\n";
            continue;
        }

        // Unordered list: - / * / +
        if (preg_match('/^[-*+]\s+/', $trimmed)) {
            $flushPara();
            $out .= "<ul>\n";
            while ($i < $n && preg_match('/^[-*+]\s+(.*)$/', rtrim($lines[$i]), $m)) {
                $out .= '  <li>' . markdown_inline($m[1]) . "</li>\n";
                $i++;
            }
            $out .= "</ul>\n";
            continue;
        }

        // Ordered list: 1. 2. etc.
        if (preg_match('/^\d+\.\s+/', $trimmed)) {
            $flushPara();
            $out .= "<ol>\n";
            while ($i < $n && preg_match('/^\d+\.\s+(.*)$/', rtrim($lines[$i]), $m)) {
                $out .= '  <li>' . markdown_inline($m[1]) . "</li>\n";
                $i++;
            }
            $out .= "</ol>\n";
            continue;
        }

        // Blank line: flush paragraph
        if ($trimmed === '') {
            $flushPara();
            $i++;
            continue;
        }

        // Regular text: accumulate into paragraph
        $para[] = $trimmed;
        $i++;
    }

    $flushPara();
    return $out;
}

function markdown_inline(string $text): string {
    // Step 1: extract code spans — escape content and store as placeholder.
    $codes = [];
    $text  = preg_replace_callback('/`([^`]+)`/', static function (array $m) use (&$codes): string {
        $key         = "\x02c" . count($codes) . "\x03";
        $codes[$key] = '<code>' . htmlspecialchars($m[1], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</code>';
        return $key;
    }, $text) ?? $text;

    // Step 2: extract links — validate URL and escape both href and text.
    $links = [];
    $text  = preg_replace_callback('/\[([^\]]*)\]\(([^)]*)\)/', static function (array $m) use (&$links): string {
        $key         = "\x02l" . count($links) . "\x03";
        $url         = markdown_safe_url(trim($m[2]));
        $label       = htmlspecialchars($m[1], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $links[$key] = $url !== null
            ? '<a href="' . htmlspecialchars($url, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '">' . $label . '</a>'
            : $label;
        return $key;
    }, $text) ?? $text;

    // Step 3: HTML-escape everything else (safe for bold/italic regex below).
    $text = htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    // Step 4: apply bold/italic on already-escaped text (no HTML injection possible).
    $text = preg_replace('/\*\*\*(.+?)\*\*\*/u', '<strong><em>$1</em></strong>', $text) ?? $text;
    $text = preg_replace('/\*\*(.+?)\*\*/u',     '<strong>$1</strong>',          $text) ?? $text;
    $text = preg_replace('/\*(.+?)\*/u',          '<em>$1</em>',                 $text) ?? $text;

    // Step 5: restore placeholders.
    return strtr($text, $codes + $links);
}

function markdown_safe_url(string $url): ?string {
    if ($url === '') return null;
    // Allow http, https, mailto, relative paths (/, #, ../) only.
    if (preg_match('/^(https?:|mailto:|\/|#|\.\.\/)/i', $url)) {
        return $url;
    }
    return null;
}
