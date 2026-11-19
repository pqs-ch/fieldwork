module ApplicationLayout
  class WorkspaceController < ApplicationController
    before_action :set_area

    def projects
      @title = 'Projects'
      @description = 'Delivery plans, ownership and upcoming milestones across Northstar.'
      @columns = [
        { label: 'Project', wrap: 'wrap', row_header: true }, { label: 'Owner', wrap: 'nowrap' },
        { label: 'State', wrap: 'nowrap', status: true }, { label: 'Next milestone', wrap: 'wrap' },
        { label: 'Target date', wrap: 'nowrap' }, { label: 'Budget (CHF)', wrap: 'nowrap', align: 'number' },
        { label: 'Team', wrap: 'wrap' }
      ]
      @rows = WorkspaceData::PROJECTS
      render :table
    end

    def requests
      @title = 'Work queue'
      @description = 'Coordinate assessments, orders and installations across the workplace.'
      @columns = [
        { label: 'Request', wrap: 'nowrap', row_header: true }, { label: 'Subject', wrap: 'wrap' },
        { label: 'State', wrap: 'nowrap', status: true }, { label: 'Owner', wrap: 'nowrap' },
        { label: 'Location', wrap: 'wrap' }, { label: 'Next activity', wrap: 'wrap' }
      ]
      @rows = WorkspaceData::REQUESTS
      render :table
    end

    def scheduled
      @title = 'Scheduled visits'
      @description = 'Upcoming work at reception, meeting rooms and the warehouse.'
      @columns = [
        { label: 'Date', wrap: 'nowrap' }, { label: 'Time', wrap: 'nowrap' },
        { label: 'Work', wrap: 'wrap', row_header: true }, { label: 'Location', wrap: 'wrap' },
        { label: 'Assigned to', wrap: 'nowrap' }, { label: 'Request', wrap: 'nowrap' }
      ]
      @rows = WorkspaceData::VISITS
      render :table
    end

    def equipment
      @title = 'Equipment'
      @description = 'Equipment with open service work and its responsible coordinator.'
      @columns = [
        { label: 'Asset', wrap: 'nowrap', row_header: true }, { label: 'Equipment', wrap: 'wrap' },
        { label: 'Location', wrap: 'wrap' }, { label: 'State', wrap: 'nowrap', status: true },
        { label: 'Owner', wrap: 'nowrap' }, { label: 'Open request', wrap: 'nowrap' }
      ]
      @rows = WorkspaceData::EQUIPMENT
      render :table
    end

    def people
      @title = 'People'
      @description = 'Find the people coordinating delivery and workplace services.'
    end

    def account
      @title = 'Your account'
      @description = 'Your Northstar account and working context.'
    end

    private

    def set_area
      @area = %w[requests scheduled equipment].include?(action_name) ? 'workplace' : action_name
    end
  end
end
