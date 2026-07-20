import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  label: { fontSize: 9, color: "#666666", textTransform: "uppercase", marginBottom: 2 },
  block: { border: "1pt solid #cccccc", borderRadius: 4, padding: 12, marginBottom: 16 },
  heading: { fontSize: 16, fontWeight: "bold", marginBottom: 16 },
  name: { fontSize: 13, fontWeight: "bold", marginBottom: 2 },
  line: { marginBottom: 1 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  divider: { borderBottom: "1pt solid #eeeeee", marginVertical: 8 },
});

export type ShippingLabelData = {
  orderId: string;
  from: { businessName: string; addressLine1: string | null; city: string | null; country: string | null };
  to: {
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string | null;
    postalCode: string | null;
    country: string;
    phone: string | null;
  };
  items: { title: string; metalType: string | null; quantity: number }[];
};

export function ShippingLabelDocument({ orderId, from, to, items }: ShippingLabelData) {
  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <Text style={styles.heading}>Shipping Label</Text>

        <View style={styles.block}>
          <Text style={styles.label}>From</Text>
          <Text style={styles.name}>{from.businessName}</Text>
          {from.addressLine1 && <Text style={styles.line}>{from.addressLine1}</Text>}
          <Text style={styles.line}>
            {[from.city, from.country].filter(Boolean).join(", ")}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>To</Text>
          <Text style={styles.name}>{to.name}</Text>
          <Text style={styles.line}>{to.addressLine1}</Text>
          {to.addressLine2 && <Text style={styles.line}>{to.addressLine2}</Text>}
          <Text style={styles.line}>
            {[to.city, to.state, to.postalCode].filter(Boolean).join(", ")}
          </Text>
          <Text style={styles.line}>{to.country}</Text>
          {to.phone && <Text style={styles.line}>{to.phone}</Text>}
        </View>

        <Text style={styles.label}>Order {orderId.slice(0, 8).toUpperCase()}</Text>
        <View style={styles.divider} />
        {items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text>
              {item.title}
              {item.metalType ? ` (${item.metalType.replace("_", " ")})` : ""}
            </Text>
            <Text>x{item.quantity}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
