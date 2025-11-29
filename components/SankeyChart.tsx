import React, { useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

interface SankeyNode {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  color: string;
}

interface SankeyChartProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  width: number;
  height: number;
  colors?: {
    text: string;
    textSecondary: string;
  };
}

export default function SankeyChart({ nodes, links, width, height, colors }: SankeyChartProps) {
  const { colors: themeColors } = useTheme();
  const chartColors = colors || themeColors;

  const htmlContent = useMemo(() => {
    if (nodes.length === 0 || links.length === 0) {
      return '<html><body></body></html>';
    }

    // Prepare data for Plotly Sankey
    const sourceNode = nodes[0];
    const targetNodes = nodes.slice(1);

    // Create node labels with dollar amounts
    const formatAmount = (value: number) => {
      return `$${value.toFixed(0)}`;
    };
    
    const nodeLabels = [
      `${sourceNode.label}<br>${formatAmount(sourceNode.value)}`,
      ...targetNodes.map((n) => `${n.label}<br>${formatAmount(n.value)}`),
    ];

    // Create source and target arrays for links
    const source = links.map((link) => link.source);
    const target = links.map((link) => link.target);
    const value = links.map((link) => link.value);

    // Convert hex colors to rgba for links (with transparency)
    const linkColors = links.map((link) => {
      const hex = link.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.5)`;
    });

    // Node colors
    const nodeColors = [
      sourceNode.color,
      ...targetNodes.map((n) => n.color),
    ];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              background-color: transparent;
              overflow: hidden;
            }
            #plotly-chart {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="plotly-chart"></div>
          <script>
            try {
              const data = {
                type: "sankey",
                orientation: "h",
                node: {
                  pad: 20,
                  thickness: 25,
                  line: {
                    color: "${chartColors.textSecondary}",
                    width: 1
                  },
                  label: ${JSON.stringify(nodeLabels)},
                  color: ${JSON.stringify(nodeColors)}
                },
                link: {
                  source: ${JSON.stringify(source)},
                  target: ${JSON.stringify(target)},
                  value: ${JSON.stringify(value)},
                  color: ${JSON.stringify(linkColors)}
                }
              };

              const layout = {
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: {
                  color: "${chartColors.text}",
                  size: 14,
                  family: "Arial, sans-serif"
                },
                margin: {
                  l: 0,
                  r: 0,
                  t: 0,
                  b: 0
                },
                autosize: true
              };

              const config = {
                displayModeBar: false,
                responsive: true,
                staticPlot: false
              };

              Plotly.newPlot('plotly-chart', [data], layout, config);

              // Handle resize
              window.addEventListener('resize', function() {
                Plotly.Plots.resize('plotly-chart');
              });
            } catch (error) {
              console.error('Plotly error:', error);
            }
          </script>
        </body>
      </html>
    `;
  }, [nodes, links, chartColors]);

  if (nodes.length === 0 || links.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        originWhitelist={['*']}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={chartColors.text} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  webview: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
