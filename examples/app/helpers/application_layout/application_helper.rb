module ApplicationLayout
  module ApplicationHelper
    def navigation_current(destination)
      return 'true' if @area == 'workplace' && destination[:area] == @area
      return 'page' if request.path == destination[:url]
      'true' if destination[:area] == @area
    end
  end
end
