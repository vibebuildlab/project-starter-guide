import { Shield, Zap, Users, BarChart } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Secure by Default',
    description:
      'Built-in authentication, data encryption, and security best practices.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for performance with modern React and Next.js.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Multi-user support with role-based permissions.',
  },
  {
    icon: BarChart,
    title: 'Analytics Built-in',
    description: 'Track user behavior and business metrics out of the box.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our starter template includes all the essential features to build
            and scale your SaaS business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="feature-card text-center">
              <div className="bg-primary-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <feature.icon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
