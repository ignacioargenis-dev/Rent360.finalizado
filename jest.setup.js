import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  TrendingDown: () => <div data-testid="trending-down-icon">TrendingDown</div>,
  Minus: () => <div data-testid="minus-icon">Minus</div>,
  DollarSign: () => <div data-testid="dollar-sign-icon">DollarSign</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Building: () => <div data-testid="building-icon">Building</div>,
  FileText: () => <div data-testid="file-text-icon">FileText</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  XCircle: () => <div data-testid="x-circle-icon">XCircle</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  MapPin: () => <div data-testid="map-pin-icon">MapPin</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="trash-2-icon">Trash2</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  LogOut: () => <div data-testid="log-out-icon">LogOut</div>,
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="x-icon">X</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">ChevronUp</div>,
  ChevronLeft: () => <div data-testid="chevron-left-icon">ChevronLeft</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">ChevronRight</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  ArrowRight: () => <div data-testid="arrow-right-icon">ArrowRight</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
  CreditCard: () => <div data-testid="credit-card-icon">CreditCard</div>,
  File: () => <div data-testid="file-icon">File</div>,
  BarChart3: () => <div data-testid="bar-chart-3-icon">BarChart3</div>,
  PieChart: () => <div data-testid="pie-chart-icon">PieChart</div>,
  Activity: () => <div data-testid="activity-icon">Activity</div>,
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  MessageSquare: () => <div data-testid="message-square-icon">MessageSquare</div>,
  HelpCircle: () => <div data-testid="help-circle-icon">HelpCircle</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
  ThumbsUp: () => <div data-testid="thumbs-up-icon">ThumbsUp</div>,
  ThumbsDown: () => <div data-testid="thumbs-down-icon">ThumbsDown</div>,
  Share: () => <div data-testid="share-icon">Share</div>,
  Copy: () => <div data-testid="copy-icon">Copy</div>,
  Link: () => <div data-testid="link-icon">Link</div>,
  ExternalLink: () => <div data-testid="external-link-icon">ExternalLink</div>,
  Maximize: () => <div data-testid="maximize-icon">Maximize</div>,
  Minimize: () => <div data-testid="minimize-icon">Minimize</div>,
  RotateCcw: () => <div data-testid="rotate-ccw-icon">RotateCcw</div>,
  RotateCw: () => <div data-testid="rotate-cw-icon">RotateCw</div>,
  ZoomIn: () => <div data-testid="zoom-in-icon">ZoomIn</div>,
  ZoomOut: () => <div data-testid="zoom-out-icon">ZoomOut</div>,
  Move: () => <div data-testid="move-icon">Move</div>,
  Type: () => <div data-testid="type-icon">Type</div>,
  Bold: () => <div data-testid="bold-icon">Bold</div>,
  Italic: () => <div data-testid="italic-icon">Italic</div>,
  Underline: () => <div data-testid="underline-icon">Underline</div>,
  Strikethrough: () => <div data-testid="strikethrough-icon">Strikethrough</div>,
  List: () => <div data-testid="list-icon">List</div>,
  ListOrdered: () => <div data-testid="list-ordered-icon">ListOrdered</div>,
  AlignLeft: () => <div data-testid="align-left-icon">AlignLeft</div>,
  AlignCenter: () => <div data-testid="align-center-icon">AlignCenter</div>,
  AlignRight: () => <div data-testid="align-right-icon">AlignRight</div>,
  AlignJustify: () => <div data-testid="align-justify-icon">AlignJustify</div>,
  Image: () => <div data-testid="image-icon">Image</div>,
  Video: () => <div data-testid="video-icon">Video</div>,
  Music: () => <div data-testid="music-icon">Music</div>,
  Mic: () => <div data-testid="mic-icon">Mic</div>,
  MicOff: () => <div data-testid="mic-off-icon">MicOff</div>,
  Camera: () => <div data-testid="camera-icon">Camera</div>,
  CameraOff: () => <div data-testid="camera-off-icon">CameraOff</div>,
  Monitor: () => <div data-testid="monitor-icon">Monitor</div>,
  MonitorOff: () => <div data-testid="monitor-off-icon">MonitorOff</div>,
  Smartphone: () => <div data-testid="smartphone-icon">Smartphone</div>,
  Tablet: () => <div data-testid="tablet-icon">Tablet</div>,
  Laptop: () => <div data-testid="laptop-icon">Laptop</div>,
  Server: () => <div data-testid="server-icon">Server</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  HardDrive: () => <div data-testid="hard-drive-icon">HardDrive</div>,
  Wifi: () => <div data-testid="wifi-icon">Wifi</div>,
  WifiOff: () => <div data-testid="wifi-off-icon">WifiOff</div>,
  Bluetooth: () => <div data-testid="bluetooth-icon">Bluetooth</div>,
  Signal: () => <div data-testid="signal-icon">Signal</div>,
  Battery: () => <div data-testid="battery-icon">Battery</div>,
  BatteryCharging: () => <div data-testid="battery-charging-icon">BatteryCharging</div>,
  Power: () => <div data-testid="power-icon">Power</div>,
  PowerOff: () => <div data-testid="power-off-icon">PowerOff</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  ZapOff: () => <div data-testid="zap-off-icon">ZapOff</div>,
  Sun: () => <div data-testid="sun-icon">Sun</div>,
  Moon: () => <div data-testid="moon-icon">Moon</div>,
  Cloud: () => <div data-testid="cloud-icon">Cloud</div>,
  CloudRain: () => <div data-testid="cloud-rain-icon">CloudRain</div>,
  CloudSnow: () => <div data-testid="cloud-snow-icon">CloudSnow</div>,
  CloudLightning: () => <div data-testid="cloud-lightning-icon">CloudLightning</div>,
  Wind: () => <div data-testid="wind-icon">Wind</div>,
  Umbrella: () => <div data-testid="umbrella-icon">Umbrella</div>,
  Droplets: () => <div data-testid="droplets-icon">Droplets</div>,
  Thermometer: () => <div data-testid="thermometer-icon">Thermometer</div>,
  Gauge: () => <div data-testid="gauge-icon">Gauge</div>,
  Compass: () => <div data-testid="compass-icon">Compass</div>,
  Navigation: () => <div data-testid="navigation-icon">Navigation</div>,
  Map: () => <div data-testid="map-icon">Map</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  Flag: () => <div data-testid="flag-icon">Flag</div>,
  Award: () => <div data-testid="award-icon">Award</div>,
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  Medal: () => <div data-testid="medal-icon">Medal</div>,
  Gift: () => <div data-testid="gift-icon">Gift</div>,
  Package: () => <div data-testid="package-icon">Package</div>,
  ShoppingCart: () => <div data-testid="shopping-cart-icon">ShoppingCart</div>,
  ShoppingBag: () => <div data-testid="shopping-bag-icon">ShoppingBag</div>,
  Tag: () => <div data-testid="tag-icon">Tag</div>,
  Percent: () => <div data-testid="percent-icon">Percent</div>,
  Hash: () => <div data-testid="hash-icon">Hash</div>,
  AtSign: () => <div data-testid="at-sign-icon">AtSign</div>,
  DollarSign: () => <div data-testid="dollar-sign-icon">DollarSign</div>,
  Euro: () => <div data-testid="euro-icon">Euro</div>,
  PoundSterling: () => <div data-testid="pound-sterling-icon">PoundSterling</div>,
  Yen: () => <div data-testid="yen-icon">Yen</div>,
  Bitcoin: () => <div data-testid="bitcoin-icon">Bitcoin</div>,
  CreditCard: () => <div data-testid="credit-card-icon">CreditCard</div>,
  Wallet: () => <div data-testid="wallet-icon">Wallet</div>,
  PiggyBank: () => <div data-testid="piggy-bank-icon">PiggyBank</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  TrendingDown: () => <div data-testid="trending-down-icon">TrendingDown</div>,
  Minus: () => <div data-testid="minus-icon">Minus</div>,
}))

// Mock Next.js Request and Response
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Map(Object.entries(options.headers || {}))
    this.body = options.body
  }
}

global.Response = class MockResponse {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.headers = new Map(Object.entries(options.headers || {}))
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
  
  text() {
    return Promise.resolve(this.body)
  }
}

// Mock NextResponse
global.NextResponse = {
  json: jest.fn((data, options) => {
    const response = {
      status: options?.status || 200,
      json: () => Promise.resolve(data),
      headers: new Map(),
    }
    return response
  }),
}

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: global.NextRequest,
  NextResponse: global.NextResponse,
}))

// Mock NextRequest
global.NextRequest = class MockNextRequest extends global.Request {
  constructor(url, options = {}) {
    super(url, options)
    this.nextUrl = {
      pathname: new URL(url).pathname,
      searchParams: new URL(url).searchParams,
    }
  }
  
  async json() {
    if (this.body) {
      return JSON.parse(this.body)
    }
    return {}
  }
}
