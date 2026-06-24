
const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// formatUSD(1.2) -> "$1.20" ; formatUSD(1256.4) -> "$1,256.40"
export const formatUSD = (n) => USD_FORMATTER.format(Number(n) || 0);

export default formatUSD;
