import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppIcon } from '@shared/components/atoms/Icon';
import { spacing, radius, useTheme } from '@theme/index';

interface QuillHtmlRendererProps {
  html: string;
}

export const QuillHtmlRenderer: React.FC<QuillHtmlRendererProps> = ({ html }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  if (!html) return null;

  // Split HTML into blocks by <hr>, <h2>, <ul>, <p>
  const parseHtmlBlocks = (rawHtml: string) => {
    // Normalize string
    const sanitized = rawHtml
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    const blocks: { type: 'h2' | 'p' | 'ul' | 'hr'; content: string | string[] }[] = [];

    // Split by <hr> first
    const hrSections = sanitized.split(/<hr\s*\/?>/i);

    hrSections.forEach((section, sIndex) => {
      if (sIndex > 0) {
        blocks.push({ type: 'hr', content: '' });
      }

      // Regex matcher for h2, ul, p tags
      const tagRegex = /<(h2|ul|p)[^>]*>(.*?)<\/\1>/gis;
      let match;
      let lastIndex = 0;

      while ((match = tagRegex.exec(section)) !== null) {
        const tag = match[1].toLowerCase() as 'h2' | 'ul' | 'p';
        const innerContent = match[2];

        if (tag === 'h2') {
          const cleanText = innerContent.replace(/<[^>]+>/g, '').trim();
          if (cleanText) blocks.push({ type: 'h2', content: cleanText });
        } else if (tag === 'ul') {
          // Extract <li> items
          const liMatches: string[] = [];
          const liRegex = /<li[^>]*>(.*?)<\/li>/gis;
          let liMatch;
          while ((liMatch = liRegex.exec(innerContent)) !== null) {
            const cleanLi = liMatch[1].replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '').trim();
            if (cleanLi) liMatches.push(cleanLi);
          }
          if (liMatches.length > 0) blocks.push({ type: 'ul', content: liMatches });
        } else if (tag === 'p') {
          if (innerContent.trim()) {
            blocks.push({ type: 'p', content: innerContent });
          }
        }
        lastIndex = tagRegex.lastIndex;
      }
    });

    return blocks;
  };

  const renderFormattedText = (rawText: string, textStyle: any) => {
    // Handle <strong> or <b> tags inline
    const parts = rawText.split(/(<strong[^>]*>.*?<\/strong>|<b[^>]*>.*?<\/b>)/gis);

    return parts.map((part, index) => {
      if (/<strong[^>]*>|<b[^>]*>/i.test(part)) {
        const boldText = part.replace(/<[^>]+>/g, '');
        return (
          <Text key={index} style={[textStyle, styles.boldText]}>
            {boldText}
          </Text>
        );
      }
      const plainText = part.replace(/<[^>]+>/g, '');
      return <Text key={index} style={textStyle}>{plainText}</Text>;
    });
  };

  const blocks = parseHtmlBlocks(html);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.type === 'hr') {
          return <View key={`hr-${index}`} style={styles.hrDivider} />;
        }

        if (block.type === 'h2') {
          return (
            <Text key={`h2-${index}`} style={styles.h2Title}>
              {String(block.content)}
            </Text>
          );
        }

        if (block.type === 'ul' && Array.isArray(block.content)) {
          return (
            <View key={`ul-${index}`} style={styles.ulContainer}>
              {block.content.map((item, itemIdx) => (
                <View key={`li-${itemIdx}`} style={styles.liRow}>
                  <View style={styles.bulletDot}>
                    <AppIcon name="ellipse" size={6} color={colors.primary.main} />
                  </View>
                  <Text style={styles.liText}>
                    {renderFormattedText(item, styles.liText)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'p' && typeof block.content === 'string') {
          return (
            <Text key={`p-${index}`} style={styles.pText}>
              {renderFormattedText(block.content, styles.pText)}
            </Text>
          );
        }

        return null;
      })}
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    h2Title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    hrDivider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginVertical: spacing.md,
    },
    pText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.text.secondary,
      marginBottom: spacing.sm,
    },
    ulContainer: {
      marginBottom: spacing.sm,
    },
    liRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.xs + 2,
      paddingRight: spacing.sm,
    },
    bulletDot: {
      marginTop: 8,
      marginRight: spacing.sm,
    },
    liText: {
      flex: 1,
      fontSize: 13.5,
      lineHeight: 21,
      color: colors.text.secondary,
    },
    boldText: {
      fontWeight: '700',
      color: colors.text.primary,
    },
  });
