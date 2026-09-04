import Card from "@/components/ui/card";

interface Props {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection = ({ title, description, children }: Props) => (
  <Card padding={24}>
    <h2 className="text-text-primary text-[15px] font-medium">{title}</h2>
    <p className="text-text-secondary mt-1 mb-4 text-[13px]">{description}</p>
    {children}
  </Card>
);

export default SettingsSection;
