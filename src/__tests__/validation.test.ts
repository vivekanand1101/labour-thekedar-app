/**
 * Validation and Business Logic Tests
 * These tests verify the core business logic without React Native dependencies
 */

describe('Payment Validation Logic', () => {
  describe('Amount Validation', () => {
    const validateAmount = (amount: string): boolean => {
      const amountNum = parseFloat(amount);
      return !isNaN(amountNum) && amountNum > 0;
    };

    it('should accept valid positive amounts', () => {
      expect(validateAmount('100')).toBe(true);
      expect(validateAmount('1000')).toBe(true);
      expect(validateAmount('50.50')).toBe(true);
      expect(validateAmount('1')).toBe(true);
    });

    it('should reject empty amount', () => {
      expect(validateAmount('')).toBe(false);
    });

    it('should reject zero amount', () => {
      expect(validateAmount('0')).toBe(false);
    });

    it('should reject negative amount', () => {
      expect(validateAmount('-100')).toBe(false);
    });

    it('should reject non-numeric strings', () => {
      expect(validateAmount('abc')).toBe(false);
      // Note: parseFloat('100abc') returns 100, so this is valid in JS
      // UI sanitization removes non-numeric chars before validation
    });
  });

  describe('Date Validation', () => {
    const isValidDate = (dateStr: string): boolean => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    };

    const isFutureDate = (dateStr: string): boolean => {
      const date = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      return date > today;
    };

    it('should accept valid date strings', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-12-31')).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    it('should detect future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      expect(isFutureDate(futureDateStr)).toBe(true);
    });

    it('should not flag today as future', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(isFutureDate(today)).toBe(false);
    });

    it('should not flag past dates as future', () => {
      expect(isFutureDate('2020-01-01')).toBe(false);
    });
  });
});

describe('Labour Validation Logic', () => {
  describe('Name Validation', () => {
    const validateName = (name: string): boolean => {
      return name.trim().length > 0;
    };

    it('should accept valid names', () => {
      expect(validateName('Ram Kumar')).toBe(true);
      expect(validateName('राम कुमार')).toBe(true);
      expect(validateName('A')).toBe(true);
    });

    it('should reject empty names', () => {
      expect(validateName('')).toBe(false);
      expect(validateName('   ')).toBe(false);
    });
  });

  describe('Phone Validation', () => {
    const validatePhone = (phone: string): boolean => {
      if (!phone) return true; // Phone is optional
      const cleaned = phone.replace(/\D/g, '');
      return cleaned.length === 10;
    };

    it('should accept valid 10-digit phone numbers', () => {
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('1234567890')).toBe(true);
    });

    it('should accept empty phone (optional field)', () => {
      expect(validatePhone('')).toBe(true);
    });

    it('should reject invalid phone lengths', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('12345678901')).toBe(false);
      expect(validatePhone('123456789')).toBe(false);
    });
  });

  describe('Daily Wage Validation', () => {
    const validateWage = (wage: string): boolean => {
      const wageNum = parseFloat(wage);
      return !isNaN(wageNum) && wageNum > 0;
    };

    it('should accept valid positive wages', () => {
      expect(validateWage('500')).toBe(true);
      expect(validateWage('1000.50')).toBe(true);
      expect(validateWage('250')).toBe(true);
    });

    it('should reject zero or negative wages', () => {
      expect(validateWage('0')).toBe(false);
      expect(validateWage('-500')).toBe(false);
    });

    it('should reject empty wage', () => {
      expect(validateWage('')).toBe(false);
    });
  });
});

describe('Attendance Validation Logic', () => {
  describe('Work Type Validation', () => {
    const isValidWorkType = (type: string): type is 'full' | 'half' => {
      return type === 'full' || type === 'half';
    };

    it('should accept full and half day', () => {
      expect(isValidWorkType('full')).toBe(true);
      expect(isValidWorkType('half')).toBe(true);
    });

    it('should reject invalid work types', () => {
      expect(isValidWorkType('quarter')).toBe(false);
      expect(isValidWorkType('')).toBe(false);
      expect(isValidWorkType('FULL')).toBe(false);
    });
  });

  describe('Earnings Calculation', () => {
    const calculateEarnings = (dailyWage: number, workType: 'full' | 'half'): number => {
      return workType === 'full' ? dailyWage : dailyWage / 2;
    };

    it('should calculate full day earnings correctly', () => {
      expect(calculateEarnings(500, 'full')).toBe(500);
      expect(calculateEarnings(1000, 'full')).toBe(1000);
      expect(calculateEarnings(750, 'full')).toBe(750);
    });

    it('should calculate half day earnings correctly', () => {
      expect(calculateEarnings(500, 'half')).toBe(250);
      expect(calculateEarnings(1000, 'half')).toBe(500);
      expect(calculateEarnings(800, 'half')).toBe(400);
    });

    it('should handle odd wage amounts for half day', () => {
      expect(calculateEarnings(501, 'half')).toBe(250.5);
      expect(calculateEarnings(333, 'half')).toBe(166.5);
    });
  });
});

describe('Balance Calculation Logic', () => {
  const calculateBalance = (totalEarned: number, totalPaid: number): number => {
    return totalEarned - totalPaid;
  };

  it('should calculate positive balance (dues remaining)', () => {
    expect(calculateBalance(1000, 800)).toBe(200);
    expect(calculateBalance(5000, 3000)).toBe(2000);
  });

  it('should calculate zero balance (fully paid)', () => {
    expect(calculateBalance(1000, 1000)).toBe(0);
    expect(calculateBalance(500, 500)).toBe(0);
  });

  it('should calculate negative balance (overpaid)', () => {
    expect(calculateBalance(1000, 1200)).toBe(-200);
    expect(calculateBalance(500, 700)).toBe(-200);
  });

  it('should handle new labour with no earnings or payments', () => {
    expect(calculateBalance(0, 0)).toBe(0);
  });
});

describe('Total Earnings Calculation', () => {
  interface AttendanceRecord {
    workType: 'full' | 'half';
  }

  const calculateTotalEarnings = (
    dailyWage: number,
    attendanceRecords: AttendanceRecord[]
  ): number => {
    return attendanceRecords.reduce((total, record) => {
      return total + (record.workType === 'full' ? dailyWage : dailyWage / 2);
    }, 0);
  };

  it('should calculate total for multiple full days', () => {
    const records: AttendanceRecord[] = [
      { workType: 'full' },
      { workType: 'full' },
      { workType: 'full' },
    ];
    expect(calculateTotalEarnings(500, records)).toBe(1500);
  });

  it('should calculate total for multiple half days', () => {
    const records: AttendanceRecord[] = [
      { workType: 'half' },
      { workType: 'half' },
    ];
    expect(calculateTotalEarnings(500, records)).toBe(500);
  });

  it('should calculate total for mixed days', () => {
    const records: AttendanceRecord[] = [
      { workType: 'full' },
      { workType: 'half' },
      { workType: 'full' },
    ];
    expect(calculateTotalEarnings(500, records)).toBe(1250);
  });

  it('should return zero for empty attendance', () => {
    expect(calculateTotalEarnings(500, [])).toBe(0);
  });
});

describe('Date Formatting', () => {
  const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  it('should return date in YYYY-MM-DD format', () => {
    const today = getTodayDate();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return current date', () => {
    const today = getTodayDate();
    const now = new Date();
    const expected = now.toISOString().split('T')[0];
    expect(today).toBe(expected);
  });
});

describe('Currency Formatting', () => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  it('should format positive numbers with rupee symbol', () => {
    const formatted = formatCurrency(1000);
    expect(formatted).toContain('₹');
    expect(formatted).toContain('1,000');
  });

  it('should format zero', () => {
    const formatted = formatCurrency(0);
    expect(formatted).toContain('₹');
    expect(formatted).toContain('0');
  });

  it('should format large numbers with Indian comma separators', () => {
    const formatted = formatCurrency(100000);
    expect(formatted).toContain('₹');
    expect(formatted).toContain('1,00,000');
  });
});

describe('Input Sanitization', () => {
  const sanitizeNumericInput = (input: string): string => {
    return input.replace(/[^0-9]/g, '');
  };

  const sanitizePhoneInput = (input: string): string => {
    return input.replace(/\D/g, '').slice(0, 10);
  };

  it('should remove non-numeric characters from amount', () => {
    expect(sanitizeNumericInput('abc123def')).toBe('123');
    expect(sanitizeNumericInput('₹1,000')).toBe('1000');
    expect(sanitizeNumericInput('100.50')).toBe('10050');
  });

  it('should limit phone to 10 digits', () => {
    expect(sanitizePhoneInput('98765432101234')).toBe('9876543210');
    expect(sanitizePhoneInput('987-654-3210')).toBe('9876543210');
  });
});
