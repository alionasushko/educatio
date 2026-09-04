import { StyleSheet } from "@react-pdf/renderer";

const INK = "#1c1917";
const MUTED = "#57534e";
const ACCENT = "#4338ca";
const TINT = "#f5f5f4";
const RULE = "#e7e5e4";

export const styles = StyleSheet.create({
  page: {
    paddingTop: 68,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: INK,
    lineHeight: 1.5,
  },
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: ACCENT,
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  wordmark: { color: "#ffffff", fontSize: 12, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 12 },
  meta: { backgroundColor: TINT, padding: 12, borderRadius: 4 },
  metaTitle: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  metaLine: { fontSize: 9.5, color: MUTED, marginTop: 3 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    marginTop: 16,
    marginBottom: 14,
  },
  heading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    marginTop: 14,
    marginBottom: 5,
  },
  paragraph: { marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 4 },
  marker: { width: 16, color: MUTED },
  rowBody: { flex: 1 },
  bold: { fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8.5,
    color: ACCENT,
  },
});
