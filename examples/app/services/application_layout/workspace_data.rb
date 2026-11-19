module ApplicationLayout
  # Application-owned destinations and read-only synthetic content.
  module WorkspaceData
    AREAS = [
      { label: 'Projects', url: '/application-layout/projects', area: 'projects', icon: 'folder' },
      { label: 'Workplace', url: '/application-layout/workplace/requests', area: 'workplace', icon: 'building' },
      { label: 'People', url: '/application-layout/people', area: 'people', icon: 'users' }
    ].freeze
    WORKPLACE_VIEWS = [
      { label: 'Work queue', url: '/application-layout/workplace/requests', icon: 'list-todo' },
      { label: 'Scheduled visits', url: '/application-layout/workplace/scheduled', icon: 'calendar' },
      { label: 'Equipment', url: '/application-layout/workplace/equipment', icon: 'monitor' }
    ].freeze
    PROJECTS = [
      ['Customer onboarding', 'Alex Morgan', 'In progress', 'Pilot with support team', '6 Nov 2026', '24,000', 'Customer experience'],
      ['Reception renewal', 'Sam Rivera', 'Planning', 'Approve equipment shortlist', '13 Nov 2026', '18,500', 'Workplace services'],
      ['Dispatch improvements', 'Jamie Chen', 'In progress', 'Complete warehouse trial', '20 Nov 2026', '32,000', 'Operations'],
      ['Knowledge base refresh', 'Taylor Reed', 'Review', 'Review guidance with team leads', '27 Nov 2026', '12,000', 'Customer experience'],
      ['Supplier consolidation', 'Maya Patel', 'Planning', 'Review service proposals', '4 Dec 2026', '16,000', 'Finance']
    ].freeze
    REQUESTS = [
      ['SR-2048', 'Reception display flickers', 'Needs assessment', 'Alex Morgan', 'Reception', 'Assess replacement cost'],
      ['SR-2051', 'Meeting room speaker has failed', 'Ready to order', 'Sam Rivera', 'Meeting room A', 'Record replacement order'],
      ['SR-2055', 'Warehouse label printer is unreliable', 'Installation booked', 'Jamie Chen', 'Warehouse', 'Confirm installation'],
      ['SR-2058', 'Visitor Wi-Fi drops connections', 'Needs assessment', 'Alex Morgan', 'Reception', 'Check access point']
    ].freeze
    VISITS = [
      ['22 Oct 2026', '09:00–10:00', 'Install replacement label printer', 'Warehouse', 'Jamie Chen', 'SR-2055'],
      ['23 Oct 2026', '10:00–11:00', 'Inspect reception equipment', 'Reception', 'Alex Morgan', 'SR-2048'],
      ['26 Oct 2026', '14:00–15:00', 'Test conference audio', 'Meeting room A', 'Sam Rivera', 'SR-2051']
    ].freeze
    EQUIPMENT = [
      ['EQ-104', 'Visitor display', 'Reception', 'Out of service', 'Alex Morgan', 'SR-2048'],
      ['EQ-207', 'Conference speaker', 'Meeting room A', 'Out of service', 'Sam Rivera', 'SR-2051'],
      ['EQ-309', 'Label printer', 'Warehouse', 'Replacement booked', 'Jamie Chen', 'SR-2055'],
      ['EQ-412', 'Access point', 'Reception', 'Investigation needed', 'Alex Morgan', 'SR-2058']
    ].freeze
    PEOPLE = [
      ['Alex Morgan', 'Workplace coordinator', 'Workplace services', 'alex@example.com'],
      ['Sam Rivera', 'Service coordinator', 'Workplace services', 'sam@example.com'],
      ['Jamie Chen', 'Operations lead', 'Operations', 'jamie@example.com'],
      ['Taylor Reed', 'Knowledge lead', 'Customer experience', 'taylor@example.com'],
      ['Maya Patel', 'Procurement lead', 'Finance', 'maya@example.com']
    ].freeze
  end
end
