import CascadeUp from "@/components/motion/cascade-up";
import NewLessonButton from "@/components/lesson/new-lesson-button";

const DashboardEmptyState = () => (
  <div className="flex h-full items-center justify-center p-10">
    <CascadeUp delay={80}>
      <div className="mx-auto max-w-95 text-center">
        <div className="relative mx-auto mb-5.5 h-18 w-24 animate-[edu-float_5.4s_ease-in-out_infinite]">
          <div className="border-border-subtle bg-surface absolute inset-0 rounded-[10px] border shadow-(--shadow-subtle)" />
          <div className="bg-sticky-yellow absolute top-3.5 left-3 size-7.5 animate-[edu-pop-in_520ms_cubic-bezier(0.22,1,0.36,1)_200ms_both] rounded-[3px] shadow-[0_1px_3px_rgb(0_0_0/0.10)] [--rot:-6deg]" />
          <div className="bg-sticky-blue absolute top-5.5 left-12 size-7.5 animate-[edu-pop-in_520ms_cubic-bezier(0.22,1,0.36,1)_340ms_both] rounded-[3px] shadow-[0_1px_3px_rgb(0_0_0/0.10)] [--rot:5deg]" />
        </div>
        <h2 className="text-text-primary text-[19px] font-semibold tracking-[-0.015em]">
          Create your first lesson
        </h2>
        <p className="text-text-secondary mx-auto mt-2 mb-5.5 text-sm leading-[1.55]">
          A lesson is a shared whiteboard with one student. You can start one in
          seconds.
        </p>
        <NewLessonButton />
      </div>
    </CascadeUp>
  </div>
);

export default DashboardEmptyState;
