import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Flame,
  Plus,
  Trash2,
  Droplet,
  PieChart,
  Check,
  Zap,
  Info,
  Sparkles,
  Search,
  Bookmark,
  BookmarkPlus,
  X,
  Star,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import {
  calculateBMR,
  calculateNetCalories,
  calculateStepCalories,
} from '../utils/fitnessCalculations';
import { MealType, MealTemplate } from '../types';
import { indianFoodPresets } from '../data/indianFoodData';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

const defaultMealTemplates: MealTemplate[] = [
  {
    id: 'tmpl-oats-whey',
    name: 'Oatmeal & Whey Protein Shake',
    category: 'Breakfast & Snack',
    calories: 420,
    proteinG: 36,
    carbsG: 54,
    fatG: 7,
    servingDescription: '60g rolled oats + 1 scoop whey isolate + almond milk',
  },
  {
    id: 'tmpl-chicken-rice',
    name: 'Grilled Chicken & Basmati Rice',
    category: 'High Protein',
    calories: 550,
    proteinG: 48,
    carbsG: 64,
    fatG: 9,
    servingDescription: '200g chicken breast + 1 cup steamed rice + veggies',
  },
  {
    id: 'tmpl-eggs-toast',
    name: 'Boiled Eggs with Multi-grain Toast',
    category: 'Breakfast',
    calories: 360,
    proteinG: 22,
    carbsG: 28,
    fatG: 18,
    servingDescription: '3 whole eggs + 2 slices toasted whole wheat bread',
  },
  {
    id: 'tmpl-paneer-roti',
    name: 'Paneer Bhurji with 2 Phulka Rotis',
    category: 'Vegetarian',
    calories: 490,
    proteinG: 25,
    carbsG: 48,
    fatG: 22,
    servingDescription: '150g spiced cottage cheese + 2 whole wheat rotis',
    isIndianCuisine: true,
  },
];

export const NutritionView: React.FC = () => {
  const { user, todayActivity, addMeal, deleteMeal, addWater } = useFitness();

  const [mealTypeFilter, setMealTypeFilter] = useState<'all' | MealType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIndianCategory, setSelectedIndianCategory] = useState<string>('All');
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>('');
  const [targetQuickMealType, setTargetQuickMealType] = useState<MealType>('lunch');

  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>(() => {
    try {
      const stored = localStorage.getItem('apexquest_meal_templates_v1');
      return stored ? JSON.parse(stored) : defaultMealTemplates;
    } catch {
      return defaultMealTemplates;
    }
  });

  const saveMealTemplates = (templates: MealTemplate[]) => {
    setMealTemplates(templates);
    try {
      localStorage.setItem('apexquest_meal_templates_v1', JSON.stringify(templates));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAsTemplate = (meal: {
    name: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    isIndianCuisine?: boolean;
    servingDescription?: string;
  }) => {
    const newTmpl: MealTemplate = {
      id: `tmpl-${Date.now()}`,
      name: meal.name,
      category: meal.isIndianCuisine ? 'Indian Cuisine' : 'Athlete Staple',
      calories: meal.calories,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatG: meal.fatG,
      isIndianCuisine: meal.isIndianCuisine,
      servingDescription: meal.servingDescription,
    };
    saveMealTemplates([newTmpl, ...mealTemplates]);
  };

  const handleDeleteTemplate = (id: string) => {
    saveMealTemplates(mealTemplates.filter((t) => t.id !== id));
  };

  const handleLogTemplate = (template: MealTemplate) => {
    addMeal({
      name: template.name,
      mealType: targetQuickMealType,
      calories: template.calories,
      proteinG: template.proteinG,
      carbsG: template.carbsG,
      fatG: template.fatG,
      isIndianCuisine: template.isIndianCuisine,
      servingDescription: template.servingDescription,
      photoUrl: template.photoUrl,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const { dialogRef: addModalRef } = useDialogAccessibility<HTMLFormElement>({
    isOpen: showAddModal,
    onClose: () => setShowAddModal(false),
  });

  // Form states
  const [foodName, setFoodName] = useState('');
  const [targetMealType, setTargetMealType] = useState<MealType>('lunch');
  const [foodCalories, setFoodCalories] = useState<number>(450);
  const [foodProtein, setFoodProtein] = useState<number>(35);
  const [foodCarbs, setFoodCarbs] = useState<number>(45);
  const [foodFat, setFoodFat] = useState<number>(12);

  // Calorie & Net Calculations
  const bmr = calculateBMR(user.weightKg, user.heightCm, user.age, user.gender);
  const consumedCalories = todayActivity.meals.reduce((sum, m) => sum + m.calories, 0);
  const workoutBurn = todayActivity.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const stepBurn = calculateStepCalories(todayActivity.steps, user.weightKg);
  const totalBurn = workoutBurn + stepBurn;
  const netStats = calculateNetCalories(consumedCalories, bmr, workoutBurn, stepBurn);

  // Macro Totals
  const totalProtein = todayActivity.meals.reduce((sum, m) => sum + m.proteinG, 0);
  const totalCarbs = todayActivity.meals.reduce((sum, m) => sum + m.carbsG, 0);
  const totalFat = todayActivity.meals.reduce((sum, m) => sum + m.fatG, 0);

  // Daily Macro Targets (based on bodyweight 74kg)
  const targetProtein = Math.round(user.weightKg * 2.2); // ~163g
  const targetCarbs = 240;
  const targetFat = 65;

  const handleAddMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    addMeal({
      name: foodName.trim(),
      mealType: targetMealType,
      calories: Number(foodCalories),
      proteinG: Number(foodProtein),
      carbsG: Number(foodCarbs),
      fatG: Number(foodFat),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setFoodName('');
    setShowAddModal(false);
  };

  const filteredMeals =
    mealTypeFilter === 'all'
      ? todayActivity.meals
      : todayActivity.meals.filter((m) => m.mealType === mealTypeFilter);

  const filteredPresets = indianFoodPresets.filter((p) => {
    const matchesCategory = selectedIndianCategory === 'All' || p.category === selectedIndianCategory;
    const q = foodSearchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.servingDescription.toLowerCase().includes(q) ||
      p.nutritionTip.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black font-game text-white tracking-wide">
            FUEL & NET CALORIC INTAKE
          </h1>
          <p className="text-xs text-slate-400">
            Intake balance: Food Consumed - (BMR + Workouts + Steps)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          aria-label="Add Food Manually"
          className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer min-h-[44px] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
          <span>Add Custom Food</span>
        </button>
      </div>

      {/* 1. SAVED MEAL TEMPLATES & FAVORITES */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-400" />
            <h3 className="font-game font-bold text-white text-sm">
              Saved Meal Templates ({mealTemplates.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            1-Tap Rations
          </span>
        </div>

        {/* Target Meal Type Quick Switcher */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-[11px] text-slate-400 font-mono">Log into:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 text-[10px]">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => (
              <button
                key={mealType}
                onClick={() => setTargetQuickMealType(mealType)}
                className={`px-2 py-0.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  targetQuickMealType === mealType
                    ? 'bg-amber-500 text-amber-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mealType}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Horizontal Carousel */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {mealTemplates.map((template) => (
            <div
              key={template.id}
              className="min-w-[200px] max-w-[220px] bg-slate-950/80 border border-white/10 hover:border-amber-500/40 rounded-2xl p-3 flex flex-col justify-between shrink-0 group transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/5 text-amber-400 font-bold">
                    {template.category}
                  </span>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    aria-label={`Delete ${template.name} template`}
                    className="text-slate-600 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <h4 className="font-bold text-white text-xs line-clamp-1 mt-1.5">
                  {template.name}
                </h4>
                <div className="font-mono text-amber-400 font-bold text-xs mt-0.5">
                  {template.calories} kcal
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {template.proteinG}g P • {template.carbsG}g C • {template.fatG}g F
                </p>
              </div>

              <button
                onClick={() => handleLogTemplate(template)}
                aria-label={`Log ${template.name} into ${targetQuickMealType}`}
                className="mt-2.5 py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 min-h-[32px]"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span className="capitalize">Log to {targetQuickMealType}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. INSTANT FOOD PRESET CATALOG WITH SEARCH */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🍛</span>
            <h3 className="font-game font-bold text-white text-sm">
              Nutrient Food Catalog ({filteredPresets.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Verified Macros
          </span>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Search food presets by name or ingredients"
            placeholder="Search thalis, paneer, biryani, oats, protein..."
            value={foodSearchQuery}
            onChange={(e) => setFoodSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          {foodSearchQuery && (
            <button
              onClick={() => setFoodSearchQuery('')}
              aria-label="Clear food search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar pb-1">
          {['All', 'High Protein', 'Vegetarian', 'South Indian', 'Traditional Curries', 'Breakfast & Snacks', 'Non-Veg'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedIndianCategory(cat)}
              className={`px-3 py-1.5 rounded-xl shrink-0 transition-colors cursor-pointer min-h-[34px] ${
                selectedIndianCategory === cat
                  ? 'bg-amber-500 text-amber-950 font-black'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Presets Grid */}
        {filteredPresets.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No dishes found matching "{foodSearchQuery}". Try another keyword or tap "Add Custom Food".
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="bg-slate-950/80 border border-white/10 hover:border-amber-500/40 rounded-2xl p-2.5 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="relative rounded-xl overflow-hidden aspect-video mb-2 bg-slate-900">
                    <img
                      src={preset.photoUrl}
                      alt={preset.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-amber-400 font-bold">
                      {preset.calories} kcal
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs line-clamp-1 leading-snug">
                    {preset.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {preset.proteinG}g P • {preset.carbsG}g C • {preset.fatG}g F
                  </p>
                </div>

                <button
                  onClick={() => {
                    addMeal({
                      name: preset.name,
                      mealType: targetQuickMealType,
                      calories: preset.calories,
                      proteinG: preset.proteinG,
                      carbsG: preset.carbsG,
                      fatG: preset.fatG,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      photoUrl: preset.photoUrl,
                      isIndianCuisine: true,
                      servingDescription: preset.servingDescription,
                    });
                  }}
                  aria-label={`Log ${preset.name} into ${targetQuickMealType}`}
                  className="mt-2 py-1.5 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 min-h-[36px]"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span className="capitalize">Log to {targetQuickMealType}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span className="font-game font-bold text-sm text-white">Daily Net Caloric Energy</span>
          </div>
          <span
            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full font-game ${
              netStats.status === 'deficit'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {netStats.status} zone
          </span>
        </div>

        {/* Big Net Result Display */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/5 text-center my-2">
          <span className="text-[11px] text-slate-400 uppercase font-game">Net Caloric Balance</span>
          <div className="text-4xl font-black font-mono my-1">
            <span className={netStats.net <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
              {netStats.net > 0 ? `+${netStats.net}` : netStats.net}
            </span>
            <span className="text-sm font-normal text-slate-400 ml-1">kcal</span>
          </div>
          <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">{netStats.description}</p>
        </div>

        {/* Mathematical Equation Ribbon */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-xs mt-3 pt-3 border-t border-white/5">
          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-[10px] text-amber-400 block font-medium">Food In</span>
            <span className="font-mono font-bold text-white text-sm">+{consumedCalories}</span>
          </div>

          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-[10px] text-rose-400 block font-medium">Workouts</span>
            <span className="font-mono font-bold text-white text-sm">-{workoutBurn}</span>
          </div>

          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-[10px] text-teal-400 block font-medium">Steps Burn</span>
            <span className="font-mono font-bold text-white text-sm">-{stepBurn}</span>
          </div>

          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-[10px] text-cyan-400 block font-medium">Basal BMR</span>
            <span className="font-mono font-bold text-white text-sm">-{bmr}</span>
          </div>
        </div>
      </div>

      {/* 2. MACRONUTRIENT RINGS & TARGETS */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <h3 className="font-game font-bold text-white text-sm">Daily Macro Target Breakdown</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {consumedCalories} / {user.dailyCalorieBudget} kcal Budget
          </span>
        </div>

        {/* 3 Macro Bars */}
        <div className="space-y-2.5">
          {/* Protein */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Protein (Muscle Growth)
              </span>
              <span className="text-white font-bold">
                {totalProtein}g / {targetProtein}g ({Math.min(100, Math.round((totalProtein / targetProtein) * 100))}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300 glow-emerald"
                style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Carbohydrates (Workout Energy)
              </span>
              <span className="text-white font-bold">
                {totalCarbs}g / {targetCarbs}g ({Math.min(100, Math.round((totalCarbs / targetCarbs) * 100))}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300 glow-cyan"
                style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}
              />
            </div>
          </div>

          {/* Fats */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Dietary Fats (Hormone Health)
              </span>
              <span className="text-white font-bold">
                {totalFat}g / {targetFat}g ({Math.min(100, Math.round((totalFat / targetFat) * 100))}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-300 glow-rose"
                style={{ width: `${Math.min(100, (totalFat / targetFat) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. WATER HYDRATION CONTROLLER */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Droplet className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Water Hydration</h4>
            <p className="text-xs text-blue-400 font-mono">
              {todayActivity.waterMl} / {user.dailyGoalWaterMl} ml (
              {Math.min(100, Math.round((todayActivity.waterMl / user.dailyGoalWaterMl) * 100))}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addWater(250)}
            aria-label="Add 250ml water"
            className="py-2 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-mono font-bold border border-blue-500/30 cursor-pointer transition-colors min-h-[44px] flex items-center justify-center"
          >
            +250 ml
          </button>
          <button
            onClick={() => addWater(500)}
            aria-label="Add 500ml water"
            className="py-2 px-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-mono font-bold cursor-pointer transition-colors min-h-[44px] flex items-center justify-center"
          >
            +500 ml
          </button>
        </div>
      </div>

      {/* 4. TODAY'S FOOD LOGS */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
            <h3 className="font-game font-bold text-white text-sm">Today's Meals ({todayActivity.meals.length})</h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[10px]">
            {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setMealTypeFilter(filter)}
                aria-label={`Filter by ${filter} meals`}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors min-h-[36px] ${
                  mealTypeFilter === filter
                    ? 'bg-emerald-500 text-emerald-950 font-black'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredMeals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No meals recorded for this filter. Tap "Add Food" to log your nutrition!
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMeals.map((meal) => (
              <div
                key={meal.id}
                className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-xs gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1 flex-1">
                  {meal.photoUrl ? (
                    <img
                      src={meal.photoUrl}
                      alt={meal.name}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white truncate">{meal.name}</span>
                      {meal.isIndianCuisine && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          🍛 Indian
                        </span>
                      )}
                      <span className="text-[10px] font-mono capitalize px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                        {meal.mealType}
                      </span>
                    </div>
                    {meal.servingDescription && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {meal.servingDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                      <span className="text-emerald-400 font-semibold">{meal.proteinG}g P</span>
                      <span>•</span>
                      <span className="text-cyan-400">{meal.carbsG}g C</span>
                      <span>•</span>
                      <span className="text-rose-400">{meal.fatG}g F</span>
                      <span>•</span>
                      <span>{meal.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono font-bold text-amber-400 text-sm mr-1">
                    {meal.calories} kcal
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveAsTemplate(meal)}
                    title="Save as reusable Meal Template"
                    aria-label={`Save ${meal.name} as reusable template`}
                    className="w-8 h-8 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer flex items-center justify-center min-h-[36px] min-w-[36px]"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMeal(meal.id)}
                    title="Delete meal entry"
                    aria-label={`Delete ${meal.name}`}
                    className="w-8 h-8 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center justify-center min-h-[36px] min-w-[36px]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <form
            ref={addModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-meal-dialog-title"
            onSubmit={handleAddMealSubmit}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 id="add-meal-dialog-title" className="font-game font-bold text-white text-base">Log Food Intake</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close food intake modal"
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label htmlFor="nutrition-food-name" className="text-[10px] text-slate-400 block mb-1">Food Item Name</label>
              <input
                id="nutrition-food-name"
                type="text"
                placeholder="e.g. Grilled Chicken Breast with Jasmine Rice"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label htmlFor="nutrition-meal-type" className="text-[10px] text-slate-400 block mb-1">Meal Classification</label>
              <select
                id="nutrition-meal-type"
                value={targetMealType}
                onChange={(e) => setTargetMealType(e.target.value as MealType)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white capitalize focus:outline-none focus:border-emerald-500"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-950 p-2 rounded-xl border border-white/10 text-center">
                <span className="text-[10px] text-amber-400 block font-bold">Calories</span>
                <input
                  type="number"
                  aria-label="Calories"
                  value={foodCalories}
                  onChange={(e) => setFoodCalories(Number(e.target.value))}
                  className="w-full bg-transparent text-center font-mono font-bold text-white text-xs mt-1"
                />
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-white/10 text-center">
                <span className="text-[10px] text-emerald-400 block font-bold">Protein (g)</span>
                <input
                  type="number"
                  aria-label="Protein in grams"
                  value={foodProtein}
                  onChange={(e) => setFoodProtein(Number(e.target.value))}
                  className="w-full bg-transparent text-center font-mono font-bold text-white text-xs mt-1"
                />
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-white/10 text-center">
                <span className="text-[10px] text-cyan-400 block font-bold">Carbs (g)</span>
                <input
                  type="number"
                  aria-label="Carbs in grams"
                  value={foodCarbs}
                  onChange={(e) => setFoodCarbs(Number(e.target.value))}
                  className="w-full bg-transparent text-center font-mono font-bold text-white text-xs mt-1"
                />
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-white/10 text-center">
                <span className="text-[10px] text-rose-400 block font-bold">Fat (g)</span>
                <input
                  type="number"
                  aria-label="Fat in grams"
                  value={foodFat}
                  onChange={(e) => setFoodFat(Number(e.target.value))}
                  className="w-full bg-transparent text-center font-mono font-bold text-white text-xs mt-1"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all mt-2"
            >
              Log Food & Update Net Caloric Balance
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
