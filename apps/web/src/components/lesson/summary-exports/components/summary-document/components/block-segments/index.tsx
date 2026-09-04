import { Text } from "@react-pdf/renderer";
import type { SummaryBlock } from "@/lib/summary-markdown";
import { styles } from "../../helpers/styles";

interface Props {
  block: SummaryBlock;
}

const BlockSegments = ({ block }: Props) => (
  <>
    {block.segments.map((segment, index) => (
      <Text key={index} style={segment.bold ? styles.bold : undefined}>
        {segment.text}
      </Text>
    ))}
  </>
);

export default BlockSegments;
